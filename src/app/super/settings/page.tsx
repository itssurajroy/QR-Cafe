// Copyright (c) 2026 QRslice. All rights reserved.
import { redirect } from "next/navigation";

export default function SuperSettingsRedirect() {
  redirect("/super?tab=settings");
}
