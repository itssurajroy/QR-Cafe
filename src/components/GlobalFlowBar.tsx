"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function GlobalFlowBar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(true);

  // COMPLETELY HIDE toolbar on customer dining menu pages so it never interferes with clicks
  if (pathname.startsWith("/t/") || pathname.startsWith("/order/")) {
    return null;
  }

  const LINKS = [
    { href: "/", label: "🏠 Home", color: "text-stone-300 hover:text-white" },
    { href: "/c/curry-leaf/t/01", label: "📱 Table 01 QR", color: "text-amber-400 font-bold" },
    { href: "/pos", label: "⚡ All-in-One POS", color: "text-amber-400 font-bold" },
    { href: "/admin", label: "📊 Café Admin", color: "text-purple-400 font-bold" },
    { href: "/super", label: "🏢 Super Admin", color: "text-blue-400 font-bold" },
  ];

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="fixed bottom-4 right-4 z-20 px-3 py-1.5 rounded-full bg-stone-900/90 border border-stone-700 text-stone-300 text-[11px] font-bold shadow-xl backdrop-blur-md hover:bg-stone-800 cursor-pointer no-print flex items-center gap-1.5 pointer-events-auto"
      >
        <span>⚡ Flow</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-20 max-w-2xl w-[94%] sm:w-auto bg-stone-900/95 border border-stone-700/80 rounded-2xl px-3 py-2 shadow-2xl backdrop-blur-xl no-print flex items-center justify-between gap-3 text-xs pointer-events-auto">
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
        <span className="text-[10px] font-black text-stone-500 uppercase tracking-widest pl-1 hidden sm:inline">
          Flow:
        </span>
        {LINKS.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`px-2.5 py-1 rounded-xl whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer ${
                isActive
                  ? "bg-amber-500 text-stone-950 font-black shadow-md shadow-amber-500/20"
                  : `hover:bg-stone-800 ${link.color}`
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </div>

      <button
        onClick={() => setCollapsed(true)}
        className="text-stone-500 hover:text-stone-300 text-xs px-1.5 py-0.5 rounded cursor-pointer"
        title="Minimize flow navigator"
      >
        ✕
      </button>
    </div>
  );
}
