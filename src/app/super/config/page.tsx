// Copyright (c) 2026 QRslice. All rights reserved.
import { redirect } from "next/navigation";

export default function SuperConfigRedirect() {
  redirect("/super?tab=config");
}
