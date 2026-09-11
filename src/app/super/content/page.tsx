import { redirect } from "next/navigation";
import Link from "next/link";
import { requireSuperAdmin } from "@/lib/auth";
import { listContent } from "@/lib/content";
import { ContentEditor } from "./ContentEditor";

export const dynamic = "force-dynamic";

export default async function SuperContentPage() {
  const user = await requireSuperAdmin();
  if (!user) redirect("/login");

  const initial = await listContent();

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="text-lg font-extrabold">Site Content</h1>
            <p className="text-xs text-slate-500">
              Edit landing, emails, and legal copy live. Empty = built-in defaults. Changes go live within a minute.
            </p>
          </div>
          <Link href="/super" className="text-xs font-bold text-indigo-600 hover:underline shrink-0">
            ← Console
          </Link>
        </div>
        <ContentEditor initial={initial} />
      </div>
    </main>
  );
}
