// Copyright (c) 2026 QRslice. All rights reserved.
export type RolloutFlag = { enabled: boolean; rollout_pct: number; allow_list: string[] };

export function isFlagOn(flag: RolloutFlag, restaurantId: string): boolean {
  if (!flag.enabled) return false;
  if (flag.allow_list.includes(restaurantId)) return true;
  if (flag.rollout_pct >= 100) return true;
  if (flag.rollout_pct <= 0) return false;
  let h = 0;
  for (const c of restaurantId) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h % 100 < flag.rollout_pct;
}
