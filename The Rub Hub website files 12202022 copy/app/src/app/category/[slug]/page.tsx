import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ProviderCard } from "@/components/directory/provider-card";
import { Pagination } from "@/components/directory/pagination";
import type { Metadata } from "next";

const PAGE_SIZE = 20;

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await prisma.category.findUnique({
    where: { slug },
    select: { name: true },
  });

  if (!category) {
    return { title: "Category Not Found" };
  }

  return {
    title: `${category.name} Providers — The Rub Hub`,
    description: `Find ${category.name.toLowerCase()} providers on The Rub Hub.`,
  };
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const skip = (page - 1) * PAGE_SIZE;

  const category = await prisma.category.findUnique({ where: { slug } });

  if (!category) notFound();

  const [totalCount, providers] = await Promise.all([
    prisma.provider.count({
      where: {
        status: "active",
        categories: { some: { categoryId: category.id } },
      },
    }),
    prisma.provider.findMany({
      where: {
        status: "active",
        categories: { some: { categoryId: category.id } },
      },
      include: {
        categories: { include: { category: true } },
        locations: { select: { city: true, state: true }, take: 1 },
      },
      orderBy: { name: "asc" },
      skip,
      take: PAGE_SIZE,
    }),
  ]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const start = skip + 1;
  const end = Math.min(skip + PAGE_SIZE, totalCount);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <nav aria-label="Breadcrumb" className="text-sm text-zinc-500">
        <Link href="/" className="hover:underline">
          Home
        </Link>
        <span className="mx-2">&rsaquo;</span>
        <Link href="/directory" className="hover:underline">
          Directory
        </Link>
        <span className="mx-2">&rsaquo;</span>
        <span className="text-zinc-900">{category.name}</span>
      </nav>

      <h1 className="mt-4 text-3xl font-bold text-zinc-900">
        {category.name} Providers
      </h1>

      <div className="mt-8">
        {totalCount > 0 ? (
          <>
            <p className="mb-4 text-sm text-zinc-500">
              Showing {start}&ndash;{end} of {totalCount} providers
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {providers.map((provider) => (
                <ProviderCard key={provider.id} provider={provider} />
              ))}
            </div>
            <Suspense fallback={null}>
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                basePath={`/category/${slug}`}
              />
            </Suspense>
          </>
        ) : (
          <p className="text-zinc-500">
            No providers found in this category.
          </p>
        )}
      </div>
    </div>
  );
}
