"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export function Header() {
  const { data: session, status } = useSession();

  return (
    <header className="bg-brand-blue shadow-sm">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-xl font-bold text-white">
          The Rub Hub
        </Link>
        <ul className="flex items-center gap-6 text-sm font-medium text-white/80">
          <li>
            <Link href="/directory" className="hover:text-white">
              Directory
            </Link>
          </li>
          {status === "loading" ? (
            <li>
              <span className="text-white/60">...</span>
            </li>
          ) : session?.user ? (
            <>
              {session.user.providerSlug && (
                <li>
                  <Link
                    href={`/directory/${session.user.providerSlug}`}
                    className="hover:text-white"
                  >
                    My Profile
                  </Link>
                </li>
              )}
              <li>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="hover:text-white"
                >
                  Log Out
                </button>
              </li>
            </>
          ) : (
            <li>
              <Link
                href="/auth/login"
                className="rounded-md border border-white px-4 py-1.5 text-white hover:bg-white hover:text-brand-blue transition-colors"
              >
                Log In
              </Link>
            </li>
          )}
        </ul>
      </nav>
    </header>
  );
}
