export default function Loading() {
  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto space-y-4 animate-pulse">
        <div className="h-8 w-48 rounded-xl bg-slate-200" />
        <div className="h-12 rounded-2xl bg-white border border-slate-200" />
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 rounded-2xl bg-white border border-slate-200" />
        ))}
      </div>
    </main>
  );
}
