"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  basePath?: string;
};

export function Pagination({ currentPage, totalPages, basePath = "/directory" }: PaginationProps) {
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  function buildHref(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    return `${basePath}?${params.toString()}`;
  }

  // Show up to 5 page numbers centered around current page
  const pages: number[] = [];
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, start + 4);
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return (
    <nav aria-label="Search results pages" className="mt-8 flex items-center justify-center gap-2">
      {currentPage > 1 && (
        <Link
          href={buildHref(currentPage - 1)}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-50"
        >
          Previous
        </Link>
      )}
      {pages.map((page) => (
        <Link
          key={page}
          href={buildHref(page)}
          aria-current={page === currentPage ? "page" : undefined}
          className={`rounded-md px-3 py-2 text-sm ${
            page === currentPage
              ? "bg-zinc-900 text-white"
              : "border border-zinc-300 text-zinc-600 hover:bg-zinc-50"
          }`}
        >
          {page}
        </Link>
      ))}
      {currentPage < totalPages && (
        <Link
          href={buildHref(currentPage + 1)}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-50"
        >
          Next
        </Link>
      )}
    </nav>
  );
}
