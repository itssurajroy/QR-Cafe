// Copyright (c) 2026 QRslice. All rights reserved.
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-[#E7E4F0] bg-white">
      <div className="mx-auto max-w-[1280px] px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="inline-block">
              <img src="/logo.png" alt="QRslice" className="h-8 w-auto" />
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-[#6F7185]">
              One simple flow from table to kitchen.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-sm font-bold text-[#17142B]">Product</h4>
            <ul className="mt-4 space-y-3">
              <li>
                <a href="#features" className="text-sm text-[#6F7185] transition-colors hover:text-[#17142B]">
                  QR Ordering
                </a>
              </li>
              <li>
                <a href="#features" className="text-sm text-[#6F7185] transition-colors hover:text-[#17142B]">
                  Digital Menu
                </a>
              </li>
              <li>
                <a href="#features" className="text-sm text-[#6F7185] transition-colors hover:text-[#17142B]">
                  Kitchen Display
                </a>
              </li>
              <li>
                <a href="#features" className="text-sm text-[#6F7185] transition-colors hover:text-[#17142B]">
                  Analytics
                </a>
              </li>
              <li>
                <a href="#features" className="text-sm text-[#6F7185] transition-colors hover:text-[#17142B]">
                  Inventory
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-sm font-bold text-[#17142B]">Company</h4>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href="/about" className="text-sm text-[#6F7185] transition-colors hover:text-[#17142B]">
                  About
                </Link>
              </li>
              <li>
                <a href="mailto:support@qrslice.com" className="text-sm text-[#6F7185] transition-colors hover:text-[#17142B]">
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-sm font-bold text-[#17142B]">Resources</h4>
            <ul className="mt-4 space-y-3">
              <li>
                <a href="#faq" className="text-sm text-[#6F7185] transition-colors hover:text-[#17142B]">
                  FAQ
                </a>
              </li>
              <li>
                <Link href="/login" className="text-sm text-[#6F7185] transition-colors hover:text-[#17142B]">
                  Staff Login
                </Link>
              </li>
              <li>
                <Link href="/onboarding" className="text-sm text-[#6F7185] transition-colors hover:text-[#17142B]">
                  Get Started
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-sm font-bold text-[#17142B]">Legal</h4>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href="/legal/privacy" className="text-sm text-[#6F7185] transition-colors hover:text-[#17142B]">
                  Privacy
                </Link>
              </li>
              <li>
                <Link href="/legal/terms" className="text-sm text-[#6F7185] transition-colors hover:text-[#17142B]">
                  Terms
                </Link>
              </li>
              <li>
                <Link href="/legal/refund" className="text-sm text-[#6F7185] transition-colors hover:text-[#17142B]">
                  Refund
                </Link>
              </li>
              <li>
                <Link href="/legal/cookies" className="text-sm text-[#6F7185] transition-colors hover:text-[#17142B]">
                  Cookies
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-[#E7E4F0] pt-8 sm:flex-row">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <p className="text-sm text-[#6F7185]">
              &copy; 2026 QRslice. All rights reserved.
            </p>
          </div>
          <div className="flex items-center gap-6">
          </div>
        </div>
      </div>
    </footer>
  );
}
