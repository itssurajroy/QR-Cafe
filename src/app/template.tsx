// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // We wrap the children in a motion component that will animate on mount/unmount.
  // Using the pathname as a key ensures the animation runs on route changes.
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, scale: 0.98, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: -8 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }} // Fast Apple-like spring/easing
        className="flex-1 flex flex-col min-h-dvh"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
