// Copyright (c) 2026 QRslice. All rights reserved.
export interface SuperClientProps {
  cafes: Cafe[];
  totalCafes: number;
  page: number;
  pageSize: number;
  q: string;
  planFilter: string;
  categories?: Category[];
  items?: MenuItem[];
  tables?: Table[];
  report?: {
    orders: number;
    paid: number;
    revenue: number;
    avg: number;
  };
  staff?: any[];
  kpis?: any;
  charts?: any;
  config?: any;
  recentAudit?: any[];
  initialTab?: string;
  authUsers?: Array<{ id: string; email: string; last_sign_in_at: string | null; role: string; app_metadata?: any; user_metadata?: any }>;
}

export interface Cafe {
  id: string;
  name: string;
  slug: string;
  plan: string;
  tier: string;
  trial_ends_at: string | null;
  subscription_ends_at: string | null;
  billing_status: string;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  sort_order: number;
  restaurant_id: string;
}

export interface MenuItem {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price_paise: number;
  image_url: string | null;
  is_veg: boolean;
  available: boolean;
  hsn: string | null;
  restaurant_id: string;
  sort_order?: number;
}

export interface Table {
  id: string;
  label: string;
  seats: number;
  qr_token: string | null;
  active: boolean;
  restaurant_id: string;
  sort_order?: number;
}

export interface Report {
  orders: number;
  paid: number;
  revenue: number;
  avg: number;
}
