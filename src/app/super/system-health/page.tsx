// Copyright (c) 2026 QRslice. All rights reserved.
import { redirect } from "next/navigation";

export default function SuperSystemHealthRedirect() {
  redirect("/super?tab=system-health");
}
