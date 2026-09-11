import { createSupabaseAdmin } from "@/lib/supabase/admin";

const cache = new Map<string, { v: unknown; at: number }>();
const TTL = 60_000;

/** Read a cms.* content key with a built-in fallback (used when unedited). */
export async function getContent<T>(key: string, fallback: T): Promise<T> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL) return hit.v as T;
  try {
    const db = createSupabaseAdmin();
    const { data } = await db.from("platform_config").select("value").eq("key", key).maybeSingle();
    const v = (data?.value ?? fallback) as T;
    cache.set(key, { v, at: Date.now() });
    return v;
  } catch {
    return fallback;
  }
}

/** List all cms.* keys for the admin editor. */
export async function listContent(): Promise<Record<string, unknown>> {
  const db = createSupabaseAdmin();
  const { data } = await db.from("platform_config").select("key, value").like("key", "cms.%");
  const out: Record<string, unknown> = {};
  for (const row of data ?? []) out[row.key] = (row as { value: unknown }).value;
  return out;
}

export function clearContentCache(key?: string) {
  if (key) cache.delete(key);
  else cache.clear();
}
