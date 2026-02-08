"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export function Header() {
  const { data: session, status } = useSession();

  return (
    <header className="border-b border-zinc-200 bg-white">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-xl font-bold text-zinc-900">
          The Rub Hub
        </Link>
        <ul className="flex items-center gap-6 text-sm font-medium text-zinc-600">
          <li>
            <Link href="/directory" className="hover:text-zinc-900">
              Directory
            </Link>
          </li>
          {status === "loading" ? (
            <li>
              <span className="text-zinc-400">...</span>
            </li>
          ) : session?.user ? (
            <>
              {session.user.providerSlug && (
                <li>
                  <Link
                    href={`/directory/${session.user.providerSlug}`}
                    className="hover:text-zinc-900"
                  >
                    My Profile
                  </Link>
                </li>
              )}
              <li>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="hover:text-zinc-900"
                >
                  Log Out
                </button>
              </li>
            </>
          ) : (
            <li>
              <Link href="/auth/login" className="hover:text-zinc-900">
                Log In
              </Link>
            </li>
          )}
        </ul>
      </nav>
    </header>
  );
}
