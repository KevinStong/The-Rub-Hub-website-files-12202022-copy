export function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-8 text-center text-sm text-zinc-500">
        &copy; {new Date().getFullYear()} The Rub Hub. All rights reserved.
      </div>
    </footer>
  );
}
