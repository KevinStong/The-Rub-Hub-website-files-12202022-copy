import Link from "next/link";

export function Footer() {
  return (
    <footer>
      {/* Gold CTA Bar */}
      <div className="bg-brand-gold py-4 text-center">
        <Link
          href="/auth/register"
          className="text-sm font-semibold text-white hover:underline"
        >
          Why Join? Learn More &rarr;
        </Link>
      </div>

      {/* Main Footer */}
      <div className="bg-brand-charcoal text-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-3">
          {/* Brand Column */}
          <div>
            <h3 className="text-lg font-bold">The Rub Hub</h3>
            <p className="mt-2 text-sm italic text-gray-300">
              Connecting you with health, wellness, and spa practitioners
            </p>
          </div>

          {/* Navigation Column */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
              Navigation
            </h4>
            <ul className="mt-3 space-y-2 text-sm text-gray-300">
              <li>
                <Link href="/" className="hover:text-white">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/directory" className="hover:text-white">
                  Directory
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-white">
                  About
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white">
                  Terms
                </Link>
              </li>
            </ul>
          </div>

          {/* Actions Column */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
              Get Started
            </h4>
            <div className="mt-3 flex flex-col gap-3">
              <Link
                href="/auth/login"
                className="inline-block rounded-md border border-white px-4 py-2 text-center text-sm font-medium text-white hover:bg-white hover:text-brand-charcoal transition-colors"
              >
                Member Login
              </Link>
              <Link
                href="/auth/register"
                className="inline-block rounded-md bg-brand-gold px-4 py-2 text-center text-sm font-medium text-white hover:bg-brand-gold-dark transition-colors"
              >
                Join Free Today
              </Link>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-600 py-4 text-center text-xs text-gray-400">
          &copy; {new Date().getFullYear()} The Rub Hub. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
