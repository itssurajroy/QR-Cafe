import React from "react";
import {
  QrCode,
  ChefHat,
  Grid2X2,
  UtensilsCrossed,
  LineChart,
  Locate,
  Users,
  Package,
  Heart,
} from "lucide-react";

const FEATURES = [
  {
    icon: QrCode,
    title: "QR Table Ordering",
    tag: "Zero App",
    description: "Guests scan, browse with high-res food photos, and order in 30 seconds. No app, no signup.",
    iconColor: "text-amber-600",
    iconBg: "bg-amber-100/80",
    tagColor: "bg-amber-50 text-amber-800 border-amber-200/80",
  },
  {
    icon: ChefHat,
    title: "Kitchen Display (KDS)",
    tag: "Zero Paper",
    description: "Live order tickets on tablets or screens. Color-coded timers. Tap to prep, tap to serve.",
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-100/80",
    tagColor: "bg-emerald-50 text-emerald-800 border-emerald-200/80",
  },
  {
    icon: Grid2X2,
    title: "Table & Floor Control",
    tag: "Live Floor",
    description: "Visual floor grid. See who's seated, whose food is cooking, and who needs the bill at a single glance.",
    iconColor: "text-[#5738F5]",
    iconBg: "bg-violet-100/80",
    tagColor: "bg-violet-50 text-[#5738F5] border-violet-200/80",
  },
  {
    icon: UtensilsCrossed,
    title: "Instant Menu Builder",
    tag: "Real-time",
    description: "Add dishes with photos, veg/non-veg tags, spice levels, and variants. Changes go live across all tables instantly.",
    iconColor: "text-rose-600",
    iconBg: "bg-rose-100/80",
    tagColor: "bg-rose-50 text-rose-800 border-rose-200/80",
  },
  {
    icon: Locate,
    title: "Live Order Tracking",
    tag: "Guest Delight",
    description: "Guests track status from Placed → Cooking → Ready → Served directly in their phone browser.",
    iconColor: "text-sky-600",
    iconBg: "bg-sky-100/80",
    tagColor: "bg-sky-50 text-sky-800 border-sky-200/80",
  },
  {
    icon: LineChart,
    title: "Analytics & Revenue",
    tag: "Insights",
    description: "Revenue trends, best-selling dishes, peak dining hours, and average ticket size in one clean dashboard.",
    iconColor: "text-indigo-600",
    iconBg: "bg-indigo-100/80",
    tagColor: "bg-indigo-50 text-indigo-800 border-indigo-200/80",
  },
  {
    icon: Heart,
    title: "Loyalty & CRM",
    tag: "Repeat Visits",
    description: "Guests collect points per order with just a phone number. Staff redeems discounts at counter.",
    iconColor: "text-pink-600",
    iconBg: "bg-pink-100/80",
    tagColor: "bg-pink-50 text-pink-800 border-pink-200/80",
  },
  {
    icon: Users,
    title: "Staff Roles & Access",
    tag: "Security",
    description: "Granular roles: kitchen staff, counter biller, manager, or owner. Pin-based fast access.",
    iconColor: "text-teal-600",
    iconBg: "bg-teal-100/80",
    tagColor: "bg-teal-50 text-teal-800 border-teal-200/80",
  },
  {
    icon: Package,
    title: "Inventory & Recipes",
    tag: "Low Stock Alert",
    description: "Track raw ingredient stock, deduce quantities per dish ordered, and get automated low-stock alerts.",
    iconColor: "text-orange-600",
    iconBg: "bg-orange-100/80",
    tagColor: "bg-orange-50 text-orange-800 border-orange-200/80",
  },
];

export function Features() {
  return (
    <section id="features" className="py-20 sm:py-28 bg-[#FAF9F6] relative">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-violet-50 border border-violet-200/80 rounded-full mb-4 shadow-sm">
            <span className="text-xs font-bold text-[#5738F5] uppercase tracking-wider">
              Complete Restaurant Suite
            </span>
          </div>
          <h2 className="text-3xl sm:text-[2.75rem] font-black leading-[1.15] tracking-tight text-slate-900 font-[family-name:var(--font-plus-jakarta)] mb-4">
            Everything your restaurant needs.{" "}
            <span className="text-[#5738F5]">Nothing it doesn&apos;t.</span>
          </h2>
          <p className="text-base sm:text-lg text-slate-600 font-medium leading-relaxed">
            Nine tightly-integrated modules designed specifically for high-volume cafés and restaurants in India.
          </p>
        </div>

        {/* Feature Grid: 3×3 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <div
                key={i}
                className="group relative p-7 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-sm hover:shadow-xl hover:shadow-slate-200/60 hover:border-[#5738F5]/30 hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className={`w-12 h-12 rounded-2xl ${feature.iconBg} flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                      <Icon className={`w-6 h-6 ${feature.iconColor}`} />
                    </div>
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border ${feature.tagColor}`}>
                      {feature.tag}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2 font-[family-name:var(--font-plus-jakarta)]">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-slate-600 font-medium leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
