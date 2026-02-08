"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { FormEvent, Suspense, useState } from "react";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh]" />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawCallback = searchParams.get("callbackUrl") ?? "/";
  const callbackUrl = rawCallback.startsWith("/") && !rawCallback.startsWith("//") ? rawCallback : "/";
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid email or password.");
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <section className="relative bg-brand-blue px-4 py-16">
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative mx-auto grid max-w-5xl gap-8 lg:grid-cols-2">
        {/* Login Form Card */}
        <div className="rounded-lg bg-white p-8 shadow-lg">
          <h1 className="text-2xl font-bold text-zinc-900">Log In</h1>
          <p className="mt-2 text-sm text-zinc-600">
            Sign in to manage your provider profile.
          </p>

          {error && (
            <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-zinc-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-zinc-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-brand-blue px-4 py-2 text-sm font-medium text-white hover:bg-brand-blue-dark disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-zinc-600">
            Don&apos;t have an account?{" "}
            <Link href="/auth/register" className="font-medium text-brand-blue hover:underline">
              Register
            </Link>
          </p>
        </div>

        {/* Join Today CTA Card */}
        <div className="flex flex-col justify-center rounded-lg bg-white/10 p-8 text-white backdrop-blur-sm">
          <h2 className="text-2xl font-bold">Join Today</h2>
          <p className="mt-3 text-white/90">
            Create your free practitioner profile and connect with clients looking for your services.
          </p>
          <ul className="mt-6 space-y-3 text-sm text-white/90">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-brand-gold">&#10003;</span>
              Free professional profile page
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-brand-gold">&#10003;</span>
              Showcase your services and specialties
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-brand-gold">&#10003;</span>
              Get discovered by local clients
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-brand-gold">&#10003;</span>
              Manage coupons, events, and photos
            </li>
          </ul>
          <Link
            href="/auth/register"
            className="mt-8 inline-block rounded-md bg-brand-gold px-6 py-3 text-center font-semibold text-white hover:bg-brand-gold-dark transition-colors"
          >
            Join Now — It&apos;s Free
          </Link>
        </div>
      </div>
    </section>
  );
}
