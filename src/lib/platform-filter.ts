// Copyright (c) 2026 QRslice. All rights reserved.
// Escapes raw user search text interpolated into a PostgREST `or()` filter
// (e.g. `or(name.ilike.%...%,slug.ilike.%...%)`) so `, ( ) % "` and backslash
// cannot break out of the intended LIKE pattern.
export function escapeOrFilter(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/[,()%"]/g, (c) => `\\${c}`);
}
