// Copyright (c) 2026 QRslice. All rights reserved.
import type { Variants, Transition } from "framer-motion";

/* ─── Shared easing & timing ─── */

/** Custom cubic-bezier matching Stripe/Linear feel */
const EASE = [0.25, 0.46, 0.45, 0.94] as [number, number, number, number];

const DEFAULT_TRANSITION: Transition = {
  duration: 0.6,
  ease: EASE,
};

/* ─── Viewport config (shared across all whileInView) ─── */

export const VIEWPORT_ONCE = { once: true, amount: 0.2 } as const;

/* ─── Section / Element Variants ─── */

/** Fade up from below — default scroll reveal for sections */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: DEFAULT_TRANSITION,
  },
};

/** Simple fade — for subtle elements like badges, pills */
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.5, ease: EASE },
  },
};

/** Scale in from slightly smaller — cards, pricing box */
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: DEFAULT_TRANSITION,
  },
};

/** Spring-based scale in — for pricing card wow moment */
export const springScaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 25,
      mass: 0.8,
    },
  },
};

/** Slide in from the left — testimonial cascade */
export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: DEFAULT_TRANSITION,
  },
};

/* ─── Container / Stagger Variants ─── */

/** Generic stagger container — 80ms between children */
export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

/** Faster stagger — 40ms, for feature checkmarks etc. */
export const staggerFast: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.1,
    },
  },
};

/** Slower stagger — 120ms, for step cards */
export const staggerSlow: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
};

/** Testimonial stagger — 150ms between cards */
export const staggerTestimonials: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

/** Hero entrance — longer delays for dramatic sequencing */
export const heroStagger: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
};

/* ─── Reduced motion: instant variants ─── */

/** Use these when prefers-reduced-motion is active */
export const instantVariants: Variants = {
  hidden: { opacity: 1 },
  visible: { opacity: 1 },
};

export const instantContainer: Variants = {
  hidden: {},
  visible: {},
};
