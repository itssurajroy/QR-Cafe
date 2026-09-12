// Copyright (c) 2026 QRslice. All rights reserved.
export function calcMrr(activeCount: number, monthlyPaise: number): number {
  return Math.max(0, activeCount) * Math.max(0, monthlyPaise);
}
export function calcArr(mrrPaise: number): number {
  return mrrPaise * 12;
}
