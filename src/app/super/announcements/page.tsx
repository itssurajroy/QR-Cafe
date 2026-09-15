// Copyright (c) 2026 QRslice. All rights reserved.
import { redirect } from "next/navigation";

export default function SuperAnnouncementsRedirect() {
  redirect("/super?tab=announcements");
}
