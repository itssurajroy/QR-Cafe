// Copyright (c) 2026 QRslice. All rights reserved.
import { redirect } from "next/navigation";

export default function SuperTenantsRedirect() {
  redirect("/super?tab=restaurants");
}
