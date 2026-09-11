import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function KdsPage() {
  // POS already has the comprehensive, battle-tested Kitchen Display System at /pos?view=kitchen
  redirect("/pos?view=kitchen");
}
