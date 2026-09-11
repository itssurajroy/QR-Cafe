export type Cafe = {
  id: string;
  name: string;
  slug: string;
  currency: string;
  timezone: string;
  logo_url: string | null;
  tagline?: string | null;
  accent_color?: string | null;
  address: string | null;
  gstin: string | null;
  phone: string | null;
  tax_rate: number | null;
  plan: "trial" | "active" | "suspended" | "cancelled";
  tier: "basic" | "pro";
  trial_ends_at: string | null;
  subscription_ends_at: string | null;
  billing_status: string | null;
  created_at: string;
};

export type Staff = {
  id: string;
  role: "super_admin" | "owner" | "staff";
  display_name: string | null;
  active: boolean;
  restaurant_id: string | null;
  restaurant_name: string;
  created_at: string;
};

export type KPIs = {
  total: number;
  active: number;
  trial: number;
  suspended: number;
  mrr: number;
  todayOrders: number;
  todayRevenue: number;
  trialToPaid: number;
  failedPayments: number;
  new7dCafes: number;
  trialsEnding7d: number;
  new7d: number;
};

export type SuperClientProps = {
  cafes: Cafe[];
  totalCafes: number;
  page: number;
  pageSize: number;
  q: string;
  planFilter: string;
  staff: Staff[];
  kpis: KPIs;
  charts: {
    revenue14: Array<{ date: string; revenue: number; orders: number }>;
    byPlan: Array<{ name: string; value: number; color: string }>;
    topCafes: Array<{ id: string; name: string; slug: string; revenue_paise: number; tier: string }>;
  };
  config: Record<string, any>;
  recentAudit: any[];
};
