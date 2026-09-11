import { createSupabaseAdmin } from "@/lib/supabase/admin";

const cache = new Map<string, { v: boolean; at: number }>();
const TTL = 60_000;

export async function isFeatureEnabled(key: string): Promise<boolean> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL) return hit.v;
  const db = createSupabaseAdmin();
  const { data } = await db.from("feature_flags").select("enabled").eq("key", key).maybeSingle();
  const v = data?.enabled === true;
  cache.set(key, { v, at: Date.now() });
  return v;
}
