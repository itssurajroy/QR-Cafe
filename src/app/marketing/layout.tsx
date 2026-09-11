
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-100 print:bg-white flex items-center justify-center py-10 print:py-0">
      {children}
    </div>
  );
}
