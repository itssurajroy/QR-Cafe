import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { getTenantBySlugAndTableLabel, canOrder } from '@/lib/tenant';
import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import { MenuClient } from "@/features/menu/MenuClient";
import Link from 'next/link';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; tableLabel: string }>;
}): Promise<Metadata> {
  const { slug, tableLabel } = await params;
  const { tenant } = await getTenantBySlugAndTableLabel(slug, tableLabel);
  const cleanLabel = decodeURIComponent(tableLabel);
  const cafeName = tenant?.name || 'QR Café';

  return {
    title: cafeName + ' — Table ' + cleanLabel + ' Menu & Ordering',
    description: 'Browse the contactless digital menu and order fresh food & drinks directly from Table ' + cleanLabel + ' at ' + cafeName + '.',
    openGraph: {
      title: cafeName + ' | Table ' + cleanLabel,
      description: 'Order fresh food & beverages directly from your table.',
      images: tenant?.logo_url ? [tenant.logo_url] : [],
    },
  };
}

export default async function NamedCafeTablePage({
  params,
}: {
  params: Promise<{ slug: string; tableLabel: string }>;
}) {
  const { slug, tableLabel } = await params;
  const { tenant, table } = await getTenantBySlugAndTableLabel(slug, tableLabel);

  if (!tenant || !table || !table.active) {
    return (
      <main className="min-h-screen bg-stone-950 text-stone-100 flex items-center justify-center p-6 selection:bg-amber-500 selection:text-black">
        <div className="bg-stone-900 border border-stone-800 rounded-3xl p-8 max-w-md w-full text-center space-y-4 shadow-2xl backdrop-blur-xl">
          <div className="w-16 h-16 rounded-3xl bg-red-950/60 border border-red-800 text-red-400 flex items-center justify-center text-3xl mx-auto shadow-inner">
            ⚠️
          </div>
          <h1 className="text-xl font-extrabold text-white">Table Not Found or Inactive</h1>
          <p className="text-xs text-stone-400 leading-relaxed">
            Table &quot;{decodeURIComponent(tableLabel)}&quot; is currently unavailable for {tenant?.name || 'this café'}. Please ask café staff or check the table number.
          </p>
          <div className="pt-2">
            <Link
              href={tenant ? ('/c/' + tenant.slug) : '/'}
              className="inline-block px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs transition-all shadow-md shadow-amber-500/20"
            >
              View Café Menu
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (!canOrder(tenant)) {
    return (
      <main className="min-h-screen bg-stone-950 text-stone-100 flex items-center justify-center p-6 selection:bg-amber-500 selection:text-black">
        <div className="bg-stone-900 border border-stone-800 rounded-3xl p-8 max-w-md w-full text-center space-y-4 shadow-2xl backdrop-blur-xl">
          <div className="w-16 h-16 rounded-3xl bg-amber-950/60 border border-amber-800 text-amber-400 flex items-center justify-center text-3xl mx-auto shadow-inner">
            ☕
          </div>
          <h1 className="text-xl font-extrabold text-white">{tenant.name}</h1>
          <div className="p-3 rounded-2xl bg-stone-950 border border-stone-800 text-xs text-stone-300">
            🚫 <strong>Ordering Temporarily Paused</strong>
            <p className="text-[11px] text-stone-400 mt-1">
              The café subscription is currently being renewed. Please order directly with your server.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const db = createSupabaseAdmin();

  const [{ data: categories }, { data: items }] = await Promise.all([
    db
      .from('menu_categories')
      .select('id, restaurant_id, name, sort_order')
      .eq('restaurant_id', tenant.id)
      .order('sort_order'),
    db
      .from('menu_items')
      .select('id, restaurant_id, category_id, name, description, price_paise, image_url, is_veg, available')
      .eq('restaurant_id', tenant.id)
      .eq('available', true),
  ]);

  return (
    <MenuClient
      qrToken={table.qr_token}
      tableLabel={table.label}
      restaurantName={tenant.name}
      categories={categories ?? []}
      items={items ?? []}
    />
  );
}
