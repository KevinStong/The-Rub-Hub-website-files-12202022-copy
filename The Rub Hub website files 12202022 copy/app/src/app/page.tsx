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
      <section className="relative bg-brand-blue px-4 py-28 text-center">
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative mx-auto max-w-3xl">
          <h1 className="text-5xl font-bold tracking-tight text-white">
            The Rub Hub
          </h1>
          <p className="mt-4 text-lg italic text-white/90">
            Connecting you with health, wellness, and spa practitioners
          </p>
          <form
            action="/directory"
            method="GET"
            className="mx-auto mt-10 flex max-w-2xl flex-col gap-3 sm:flex-row"
          >
            <label htmlFor="hero-search" className="sr-only">Search by keyword</label>
            <input
              id="hero-search"
              type="text"
              name="q"
              placeholder="Keyword (e.g. deep tissue, sports)..."
              className="flex-1 rounded-lg bg-white/20 px-4 py-3 text-white placeholder-white/70 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-white"
            />
            <label htmlFor="hero-location" className="sr-only">Search by location</label>
            <input
              id="hero-location"
              type="text"
              name="city"
              placeholder="Location (city or state)..."
              className="flex-1 rounded-lg bg-white/20 px-4 py-3 text-white placeholder-white/70 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-white"
            />
            <button
              type="submit"
              className="rounded-lg bg-brand-blue px-6 py-3 font-semibold text-white transition-colors hover:bg-brand-blue-dark"
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
            Top Services
          </h2>
          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/category/${category.slug}`}
                className="rounded-lg border border-gray-200 bg-white p-5 transition-colors hover:border-brand-blue hover:shadow-sm"
              >
                <span className="block font-semibold text-zinc-900">
                  {category.name}
                </span>
                <span className="mt-1 block text-sm text-brand-blue">
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
