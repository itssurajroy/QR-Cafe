// Copyright (c) 2026 QRslice. All rights reserved.
// Shared plan pricing fallbacks (integer paise). Canonical values live in the
// subscription_plans table — these are only used when the table is unreadable.

export const DEFAULT_MONTHLY_PAISE = 99900; // ₹999
export const DEFAULT_YEARLY_PAISE = 999900; // ₹9,999
export const DEFAULT_MONTHLY_PLAN_SLUG = "complete_monthly";
