"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent } from "react";

type SearchFormProps = {
  categories: { slug: string; name: string }[];
  specialties: { slug: string; name: string }[];
  states: string[];
};

export function SearchForm({ categories, specialties, states }: SearchFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const params = new URLSearchParams();

    const q = formData.get("q") as string;
    const category = formData.get("category") as string;
    const specialty = formData.get("specialty") as string;
    const state = formData.get("state") as string;
    const city = formData.get("city") as string;

    if (q) params.set("q", q);
    if (category) params.set("category", category);
    if (specialty) params.set("specialty", specialty);
    if (state) params.set("state", state);
    if (city) params.set("city", city);
    // Reset to page 1 on new search
    params.set("page", "1");

    router.push(`/directory?${params.toString()}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
    >
      <h2 className="text-lg font-semibold text-zinc-900">Refine Your Search</h2>
      <div className="mt-4 flex flex-col gap-3">
        <input
          type="text"
          name="q"
          placeholder="Search providers..."
          defaultValue={searchParams.get("q") ?? ""}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue"
        />
        <select
          name="category"
          defaultValue={searchParams.get("category") ?? ""}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-700 focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          name="specialty"
          defaultValue={searchParams.get("specialty") ?? ""}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-700 focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue"
        >
          <option value="">All Specialties</option>
          {specialties.map((s) => (
            <option key={s.slug} value={s.slug}>
              {s.name}
            </option>
          ))}
        </select>
        <select
          name="state"
          defaultValue={searchParams.get("state") ?? ""}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-700 focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue"
        >
          <option value="">All States</option>
          {states.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <input
          type="text"
          name="city"
          placeholder="City"
          defaultValue={searchParams.get("city") ?? ""}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue"
        />
        <button
          type="submit"
          className="w-full rounded-md bg-brand-blue px-5 py-2 text-sm font-medium text-white hover:bg-brand-blue-dark"
        >
          Search
        </button>
      </div>
    </form>
  );
}
