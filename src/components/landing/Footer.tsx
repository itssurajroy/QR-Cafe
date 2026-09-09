import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-slate-900">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 py-12 sm:px-6 lg:flex-row lg:gap-0 lg:px-8">
        <div className="flex flex-col items-center gap-2 lg:items-start">
          <Link href="/" className="text-lg font-bold text-indigo-400">
            QR Café
          </Link>
          <p className="text-sm text-slate-400">
            © 2026 QR Café. All rights reserved.
          </p>
        </div>

        <nav className="flex gap-6 text-sm text-slate-400">
          <Link href="/privacy" className="transition-colors hover:text-white">
            Privacy Policy
          </Link>
          <Link href="/terms" className="transition-colors hover:text-white">
            Terms of Service
          </Link>
          <a
            href="mailto:support@qrcafe.app"
            className="transition-colors hover:text-white"
          >
            Contact
          </a>
        </nav>
      </div>
    </footer>
  );
}
