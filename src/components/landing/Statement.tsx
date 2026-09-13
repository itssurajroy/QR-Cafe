import React from "react";

export function Statement() {
  return (
    <section className="py-20 sm:py-28 relative overflow-hidden bg-white border-y border-slate-100">
      <div className="max-w-4xl mx-auto px-5 sm:px-8 text-center">
        <blockquote className="text-2xl sm:text-4xl lg:text-[2.5rem] font-extrabold leading-[1.25] tracking-tight text-slate-900 font-[family-name:var(--font-plus-jakarta)]">
          &ldquo;We built QRslice because every café owner we met was{" "}
          <span className="text-[#5738F5]">drowning in paper chits</span> and{" "}
          <span className="text-amber-600">shouting across the kitchen</span>.
          There had to be a calmer, faster way.&rdquo;
        </blockquote>
        <div className="mt-8 flex items-center justify-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#5738F5] to-[#7C3AED] text-white flex items-center justify-center font-black text-sm shadow-md shadow-[#5738F5]/20">
            QR
          </div>
          <div className="text-left">
            <div className="text-sm font-bold text-slate-900">QRslice Product Team</div>
            <div className="text-xs font-medium text-slate-500">Made with ☕ in India for hospitality teams</div>
          </div>
        </div>
      </div>
    </section>
  );
}
