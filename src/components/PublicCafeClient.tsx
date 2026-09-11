"use client";

import { useState, useEffect, useMemo } from "react";
import { MenuClient } from "@/features/menu/MenuClient";
import { BookingWidget } from "@/features/booking/BookingWidget";
import { Tenant, TierLimits } from "@/lib/tenant";
import type { Category, MenuItem as Item } from "@/types";

type PublicCafeClientProps = {
  restaurant: Tenant;
  tables: Array<{
    id: string;
    label: string;
    seats: number;
    qr_token: string;
    active: boolean;
  }>;
  categories: Category[];
  items: Item[];
  canOrder: boolean;
  limits: TierLimits;
  upiQrUrl?: string;
};

type DietFilter = "all" | "veg" | "nonveg";

function scrollToId(id: string) {
  if (typeof document === "undefined") return;
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function shortDesc(desc: string | null | undefined): string {
  if (!desc) return "";
  const clean = desc.trim();
  return clean.length > 80 ? `${clean.slice(0, 80).trimEnd()}…` : clean;
}

export default function PublicCafeClient({
  restaurant,
  tables,
  categories,
  items,
  canOrder,
  upiQrUrl,
}: PublicCafeClientProps) {
  const [selectedQr, setSelectedQr] = useState<string | null>(null);
  const [selectedTableLabel, setSelectedTableLabel] = useState<string | null>(null);
  const [diet, setDiet] = useState<DietFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(categories[0]?.id || null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
      
      // Update active category based on scroll position
      const catElements = categories.map(c => document.getElementById(`cat-${c.id}`));
      for (let i = catElements.length - 1; i >= 0; i--) {
        const el = catElements[i];
        if (el && window.scrollY >= el.offsetTop - 150) {
          setActiveCategory(categories[i].id);
          break;
        }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [categories]);

  // If a table is selected and ordering is enabled, render the interactive MenuClient
  if (selectedQr && canOrder) {
    return (
      <div className="relative">
        <div className="fixed top-3 right-3 z-50">
          <button
            type="button"
            onClick={() => {
              setSelectedQr(null);
              setSelectedTableLabel(null);
            }}
            className="px-4 py-2 rounded-full bg-white/80 backdrop-blur-md hover:bg-white border border-slate-200/50 text-slate-700 font-bold text-xs shadow-xl shadow-black/5 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
          >
            <span>⇄ Switch Table ({selectedTableLabel})</span>
          </button>
        </div>

        <MenuClient
          qrToken={selectedQr}
          tableLabel={selectedTableLabel || "T01"}
          restaurantName={restaurant.name}
          categories={categories}
          items={items}
          upiQrUrl={upiQrUrl}
        />
      </div>
    );
  }

  const tagline = restaurant.tagline?.trim() || "Experience culinary excellence. Order instantly from your table.";
  
  const visibleItems = useMemo(() => {
    return items.filter((i) => {
      const matchesDiet = diet === "all" ? true : diet === "veg" ? i.is_veg : !i.is_veg;
      const matchesSearch = i.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (i.description && i.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesDiet && matchesSearch;
    });
  }, [items, diet, searchQuery]);

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans selection:bg-indigo-600 selection:text-white relative overflow-x-hidden">
      
      {/* Advanced Animated Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-gradient-to-br from-indigo-300/30 via-violet-300/20 to-transparent rounded-full blur-[100px] mix-blend-multiply opacity-60 animate-[spin_20s_linear_infinite]" />
        <div className="absolute top-[40%] right-[-20%] w-[50vw] h-[50vw] bg-gradient-to-tl from-amber-300/20 to-rose-300/10 rounded-full blur-[100px] mix-blend-multiply opacity-50 animate-[spin_25s_linear_infinite_reverse]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay"></div>
      </div>

      {/* Top Banner if Subscription Expired */}
      {!canOrder && (
        <div className="bg-gradient-to-r from-red-500 via-rose-500 to-red-600 text-white px-4 py-3 text-center text-xs font-bold shadow-lg flex items-center justify-center gap-2 relative z-40">
          <span className="animate-pulse">⚠️</span>
          <span>Ordering is paused. Menu is available for viewing only.</span>
        </div>
      )}

      {/* 1. Dynamic Glass Header */}
      <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/70 backdrop-blur-2xl border-b border-white/20 shadow-sm py-2' : 'bg-transparent py-4'}`}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {restaurant.logo_url ? (
              <img
                src={restaurant.logo_url}
                alt={restaurant.name}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl object-cover border-2 border-white shadow-sm shrink-0 transition-transform hover:scale-105"
              />
            ) : (
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-700 text-white font-black text-xl flex items-center justify-center shrink-0 shadow-md">
                {restaurant.name.charAt(0)}
              </div>
            )}
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight truncate">
              {restaurant.name}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-[11px] uppercase tracking-wider font-bold shrink-0 shadow-sm backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
              Live Kitchen
            </span>
          </div>
        </div>
      </header>

      {/* Spacer for fixed header */}
      <div className="h-[88px]" />

      {/* 2. Advanced Hero Section */}
      <section className="relative w-full pt-10 pb-16 px-4 text-center z-10 flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold mb-6 hover:bg-indigo-100 transition-colors cursor-pointer">
          ✨ Welcome to our digital menu
        </div>
        <h2 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-[1.05] max-w-3xl mx-auto mb-6">
          Delicious food, <br className="hidden sm:block"/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-amber-500">
            ordered effortlessly.
          </span>
        </h2>
        <p className="text-lg sm:text-xl text-slate-600 font-medium leading-relaxed max-w-2xl mx-auto mb-10">
          {tagline}
        </p>
        
        {/* Animated Search Bar */}
        <div className="w-full max-w-md mx-auto relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-2xl blur-lg opacity-20 group-hover:opacity-40 transition-opacity duration-300" />
          <div className="relative bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-2xl p-2 flex items-center shadow-lg transition-all focus-within:ring-2 focus-within:ring-indigo-500/50 focus-within:bg-white">
            <span className="px-3 text-slate-400">🔍</span>
            <input 
              type="text" 
              placeholder="Search for dishes, ingredients..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-none focus:outline-none text-slate-700 font-medium placeholder:text-slate-400 py-2 pr-4"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="px-3 text-slate-400 hover:text-slate-600">✕</button>
            )}
          </div>
        </div>
      </section>

      {/* 3. Floating Table QR Gate */}
      <div className="max-w-5xl mx-auto px-4 w-full relative z-20 -mt-6 mb-12">
        <div
          id="table-qr"
          className="bg-slate-900 rounded-[2rem] p-1 flex flex-col sm:flex-row items-center justify-between shadow-2xl shadow-slate-900/20 overflow-hidden relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 via-violet-500/20 to-amber-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <div className="bg-slate-900 rounded-[1.75rem] w-full p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-white/10 rounded-2xl backdrop-blur-md flex items-center justify-center text-3xl shrink-0 shadow-inner border border-white/5">
                📱
              </div>
              <div className="text-center sm:text-left">
                <h3 className="text-white font-black text-xl mb-1">Scan to Order</h3>
                <p className="text-slate-400 font-medium text-sm max-w-sm">
                  Find the QR code on your table to instantly view the menu, place orders, and pay without waiting.
                </p>
              </div>
            </div>
            
            <button className="px-8 py-4 bg-white text-slate-900 rounded-xl font-black text-sm shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer pointer-events-none whitespace-nowrap">
              Ready to Order? →
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 w-full flex flex-col lg:flex-row gap-8 mb-24 relative z-10">
        
        {/* Sticky Category Sidebar (Desktop) / Topbar (Mobile) */}
        <aside className="w-full lg:w-64 shrink-0">
          <div className="sticky top-[100px] z-40 bg-white/60 lg:bg-transparent backdrop-blur-xl lg:backdrop-blur-none p-2 lg:p-0 rounded-2xl lg:rounded-none border border-slate-200/50 lg:border-none shadow-sm lg:shadow-none mb-6 lg:mb-0 overflow-x-auto no-scrollbar">
            
            {/* Filters */}
            <div className="flex lg:flex-col gap-2 mb-6 p-1 bg-slate-200/50 lg:bg-transparent rounded-xl lg:rounded-none w-max lg:w-full">
               {(
                  [
                    { id: "all", label: "All Items", icon: "🍽️" },
                    { id: "veg", label: "Pure Veg", icon: "🥬" },
                    { id: "nonveg", label: "Non-Veg", icon: "🍗" },
                  ] as const
                ).map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setDiet(f.id)}
                    className={`px-4 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                      diet === f.id
                        ? "bg-white lg:bg-indigo-600 text-indigo-600 lg:text-white shadow-sm"
                        : "text-slate-600 hover:bg-white/50 lg:hover:bg-slate-200/50"
                    }`}
                  >
                    <span>{f.icon}</span>
                    <span>{f.label}</span>
                  </button>
                ))}
            </div>

            <div className="hidden lg:block h-px bg-slate-200 mb-6"></div>

            {/* Categories */}
            <nav className="flex lg:flex-col gap-2 w-max lg:w-full">
              {categories.map((cat) => {
                const count = visibleItems.filter(i => i.category_id === cat.id).length;
                if (count === 0 && searchQuery) return null; // Hide empty categories only when searching
                
                return (
                  <button
                    key={cat.id}
                    onClick={() => scrollToId(`cat-${cat.id}`)}
                    className={`px-4 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer flex items-center justify-between whitespace-nowrap ${
                      activeCategory === cat.id
                        ? "bg-slate-900 text-white shadow-md"
                        : "text-slate-500 hover:bg-slate-200/50 hover:text-slate-900"
                    }`}
                  >
                    <span>{cat.name}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${activeCategory === cat.id ? 'bg-white/20' : 'bg-slate-200 text-slate-500'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Menu Listings */}
        <div className="flex-1 space-y-16 pb-12">
          {categories.map((cat) => {
            const catItems = visibleItems.filter((i) => i.category_id === cat.id);
            if (catItems.length === 0) return null;

            return (
              <section key={cat.id} id={`cat-${cat.id}`} className="scroll-mt-[180px] lg:scroll-mt-[120px]">
                <div className="flex items-center gap-4 mb-6">
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                    {cat.name}
                  </h3>
                  <div className="h-px bg-slate-200 flex-1"></div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {catItems.map((it) => (
                    <article
                      key={it.id}
                      className="group bg-white/70 backdrop-blur-lg rounded-[2rem] overflow-hidden shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] hover:bg-white border border-slate-200/60 transition-all duration-300 hover:-translate-y-1.5 flex flex-col relative"
                    >
                      {/* Veg/Non-Veg Tag - Absolute */}
                      <div className="absolute top-4 left-4 z-10">
                          <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider shadow-lg backdrop-blur-md ${
                            it.is_veg ? "bg-white/90 text-emerald-600" : "bg-white/90 text-red-600"
                          }`}>
                            <span className={`w-2 h-2 rounded-full ${it.is_veg ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                            {it.is_veg ? "Veg" : "Non-Veg"}
                          </span>
                      </div>

                      <div className="relative w-full aspect-[4/3] overflow-hidden bg-slate-100 p-2">
                        {it.image_url ? (
                          <img
                            src={it.image_url}
                            alt={it.name}
                            loading="lazy"
                            className="w-full h-full object-cover rounded-[1.5rem] group-hover:scale-105 transition-transform duration-700 ease-out"
                          />
                        ) : (
                          <div className="w-full h-full rounded-[1.5rem] flex items-center justify-center text-6xl bg-gradient-to-br from-slate-100 to-slate-200 shadow-inner">
                            {it.is_veg ? "🥗" : "🍗"}
                          </div>
                        )}
                      </div>

                      <div className="p-5 flex flex-col flex-1">
                        <div className="flex justify-between items-start gap-4 mb-2">
                          <h4 className="font-black text-lg text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors">
                            {it.name}
                          </h4>
                          <span className="font-black text-lg text-slate-900 whitespace-nowrap">
                            ₹{(it.price_paise / 100).toLocaleString("en-IN")}
                          </span>
                        </div>
                        
                        {shortDesc(it.description) && (
                          <p className="text-sm text-slate-500 leading-relaxed line-clamp-2 mt-1 mb-6 flex-1">
                            {it.description}
                          </p>
                        )}

                        <div className="mt-auto pt-4">
                            <button
                              type="button"
                              onClick={() => scrollToId("table-qr")}
                              className="w-full h-12 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-slate-900/20 hover:shadow-indigo-600/30 active:scale-95"
                            >
                              <span>+</span>
                              <span>Add to Order</span>
                            </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            );
          })}

          {visibleItems.length === 0 && (
            <div className="text-center py-24 bg-white/50 backdrop-blur-xl rounded-[3rem] border border-slate-200/60 shadow-sm">
              <span className="text-5xl mb-4 block animate-bounce">🔍</span>
              <h3 className="text-2xl font-black text-slate-900 mb-2">No dishes found</h3>
              <p className="text-slate-500 font-medium">
                Try adjusting your search or filters to find what you're craving.
              </p>
              <button 
                onClick={() => {setSearchQuery(''); setDiet('all');}} 
                className="mt-6 px-6 py-3 bg-indigo-50 text-indigo-700 font-bold rounded-xl hover:bg-indigo-100 transition-colors"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Reservation Widget */}
      {canOrder && tables.length > 0 && (
        <section id="reserve" className="max-w-4xl mx-auto px-4 w-full mb-24 relative z-10 scroll-mt-24">
            <div className="bg-white/80 backdrop-blur-xl p-2 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-200/60">
              <BookingWidget slug={restaurant.slug} />
            </div>
        </section>
      )}

      {/* Advanced Footer */}
      <footer className="mt-auto bg-slate-950 text-slate-400 py-16 px-4 text-center relative z-10 overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80vw] h-[300px] bg-gradient-to-t from-indigo-600/20 to-transparent blur-[100px] pointer-events-none" />
        
        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-white/5 backdrop-blur-xl text-white flex items-center justify-center font-black text-3xl mx-auto mb-6 border border-white/10 shadow-2xl">
             {restaurant.name.charAt(0)}
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight mb-3">{restaurant.name}</h2>
          <p className="text-lg font-medium mb-10 max-w-md mx-auto text-slate-400">Thank you for dining with us. We hope you enjoy your experience.</p>
          
          {restaurant.google_review_url && (
            <a
              href={restaurant.google_review_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold transition-all border border-white/10 mb-12 hover:scale-105 active:scale-95"
            >
              <span className="text-xl">⭐</span> 
              <span>Review us on Google</span>
            </a>
          )}
          
          <div className="pt-10 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm font-bold text-slate-500 tracking-widest uppercase">
              Powered by <span className="text-white">QRslice</span>
            </div>
            <div className="flex gap-6 text-sm font-medium">
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
