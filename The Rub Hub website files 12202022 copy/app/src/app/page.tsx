import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ProviderCard } from "@/components/directory/provider-card";

export const metadata: Metadata = {
  title: "The Rub Hub — Find Massage Therapists & Bodywork Providers",
  description:
    "Find massage therapists and bodywork providers near you. Browse by category, search by keyword or location.",
};

export default async function Home() {
  const [categories, featuredProviders] = await Promise.all([
    prisma.category.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: { select: { providers: true } },
      },
    }),
    prisma.provider.findMany({
      where: { status: "active" },
      include: {
        categories: { include: { category: true } },
        locations: { select: { city: true, state: true }, take: 1 },
      },
      take: 6,
    }),
  ]);

  return (
    <>
      {/* Hero Section */}
      <section className="bg-zinc-900 px-4 py-24 text-center">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-5xl font-bold tracking-tight text-white">
            The Rub Hub
          </h1>
          <p className="mt-4 text-lg text-zinc-300">
            Find massage therapists and bodywork providers near you.
          </p>
          <form
            action="/directory"
            method="GET"
            className="mx-auto mt-10 flex max-w-xl gap-3"
          >
            <label htmlFor="hero-search" className="sr-only">Search for providers</label>
            <input
              id="hero-search"
              type="text"
              name="q"
              placeholder="Search by name, specialty, or location..."
              className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-white placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500"
            />
            <button
              type="submit"
              className="rounded-lg bg-white px-6 py-3 font-semibold text-zinc-900 transition-colors hover:bg-zinc-100"
            >
              Search
            </button>
          </form>
        </div>
      </section>

      {/* Category Tiles */}
      {categories.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-2xl font-bold text-zinc-900">
            Browse by Category
          </h2>
          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/category/${category.slug}`}
                className="rounded-lg bg-zinc-100 p-5 transition-colors hover:bg-zinc-200"
              >
                <span className="block font-semibold text-zinc-900">
                  {category.name}
                </span>
                <span className="mt-1 block text-sm text-zinc-500">
                  {category._count.providers}{" "}
                  {category._count.providers === 1 ? "provider" : "providers"}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured Providers */}
      {featuredProviders.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-16">
          <h2 className="text-2xl font-bold text-zinc-900">
            Featured Providers
          </h2>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featuredProviders.map((provider) => (
              <ProviderCard key={provider.id} provider={provider} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
