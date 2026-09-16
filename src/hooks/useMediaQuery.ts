// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import { useState, useEffect } from "react";

function getInitialMatches(query: string): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia === "undefined") {
    return false;
  }
  return window.matchMedia(query).matches;
}

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() => getInitialMatches(query));

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia === "undefined") {
      return;
    }
    const mql = window.matchMedia(query);
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };
    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", listener);
    } else {
      mql.addListener(listener);
    }
    return () => {
      if (typeof mql.removeEventListener === "function") {
        mql.removeEventListener("change", listener);
      } else {
        mql.removeListener(listener);
      }
    };
  }, [query]);

  return matches;
}

