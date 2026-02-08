import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { SearchForm } from "@/components/directory/search-form";
import { ProviderCard } from "@/components/directory/provider-card";
import { Pagination } from "@/components/directory/pagination";
import type { Metadata } from "next";
import type { Prisma } from "@/generated/prisma/client";

export const metadata: Metadata = {
  title: "Provider Directory — The Rub Hub",
  description: "Find massage therapists and bodywork providers near you.",
};

const PAGE_SIZE = 20;

type SearchParams = Promise<{
  q?: string;
  category?: string;
  specialty?: string;
  state?: string;
  city?: string;
  page?: string;
}>;

export default async function DirectoryPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const skip = (page - 1) * PAGE_SIZE;

  // Build dynamic where clause
  const where: Prisma.ProviderWhereInput = { status: "active" };

  if (params.q) {
    where.OR = [
      { name: { contains: params.q } },
      { bio: { contains: params.q } },
    ];
  }

  if (params.category) {
    where.categories = {
      some: { category: { slug: params.category } },
    };
  }

  if (params.specialty) {
    where.specialties = {
      some: { specialty: { slug: params.specialty } },
    };
  }

  if (params.state || params.city) {
    const locationFilter: Prisma.LocationWhereInput = {};
    if (params.state) locationFilter.state = params.state;
    if (params.city) locationFilter.city = { contains: params.city };
    where.locations = { some: locationFilter };
  }

  // Fetch filter options + results in parallel
  const [categories, specialties, states, providers, totalCount] =
    await Promise.all([
      prisma.category.findMany({
        orderBy: { name: "asc" },
        select: { slug: true, name: true },
      }),
      prisma.specialty.findMany({
        orderBy: { name: "asc" },
        select: { slug: true, name: true },
      }),
      prisma.location
        .findMany({
          where: { state: { not: "" } },
          distinct: ["state"],
          select: { state: true },
          orderBy: { state: "asc" },
        })
        .then((rows) => rows.map((r) => r.state)),
      prisma.provider.findMany({
        where,
        include: {
          categories: { include: { category: true } },
          locations: { select: { city: true, state: true }, take: 1 },
        },
        orderBy: { name: "asc" },
        skip,
        take: PAGE_SIZE,
      }),
      prisma.provider.count({ where }),
    ]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const start = skip + 1;
  const end = Math.min(skip + PAGE_SIZE, totalCount);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-bold text-zinc-900">Provider Directory</h1>
      <p className="mt-2 text-zinc-600">
        Find massage therapists and bodywork providers near you.
      </p>

      <div className="mt-6 flex flex-col gap-8 lg:flex-row">
        <aside className="w-full shrink-0 lg:w-64">
          <Suspense fallback={null}>
            <SearchForm
              categories={categories}
              specialties={specialties}
              states={states}
            />
          </Suspense>
        </aside>

        <div className="flex-1">
          {totalCount > 0 ? (
            <>
              <p className="mb-4 text-sm text-zinc-500">
                Showing {start}–{end} of {totalCount} providers
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                {providers.map((provider) => (
                  <ProviderCard key={provider.id} provider={provider} />
                ))}
              </div>
              <Suspense fallback={null}>
                <Pagination currentPage={page} totalPages={totalPages} />
              </Suspense>
            </>
          ) : (
            <p className="text-zinc-500">
              No providers found. Try adjusting your search filters.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
