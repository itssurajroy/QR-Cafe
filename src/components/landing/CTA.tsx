import Link from "next/link";
import { getContent } from "@/lib/content";

const DEFAULTS = {
  headline: "Ready to run a tighter café?",
  sub: "Join independent cafés using QrSlice to cut order errors and speed up service.",
  primaryCta: "Start free",
  secondaryCta: "Talk to us",
};

export async function CTA() {
  const c = await getContent("cms.cta", DEFAULTS);
  return (
    <section className="bg-[#EEEAFE]">
      <div className="mx-auto max-w-[1280px] px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-[30px] font-extrabold text-[#17142B] sm:text-[42px] leading-[1.1]">
            {c.headline}
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-base text-[#6F7185] sm:text-lg leading-relaxed">
            {c.sub}
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/onboarding"
              className="inline-flex items-center justify-center gap-2 rounded-[12px] bg-[#5738F5] px-8 py-4 text-base font-semibold text-white shadow-[0_8px_30px_rgba(87,56,245,0.25)] transition-all duration-150 hover:bg-[#4328D9] active:scale-[0.98]"
            >
              {c.primaryCta}
              <span>→</span>
            </Link>
            <a
              href="mailto:support@qrslice.app"
              className="inline-flex items-center justify-center rounded-[12px] border border-[#E7E4F0] bg-white px-8 py-4 text-base font-semibold text-[#17142B] transition-all duration-150 hover:border-[#5738F5] hover:text-[#5738F5]"
            >
              {c.secondaryCta}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
