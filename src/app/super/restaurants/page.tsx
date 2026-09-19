// Copyright (c) 2026 QRslice. All rights reserved.
import { redirect } from "next/navigation";

export default function SuperRestaurantsRedirect() {
  redirect("/super?tab=restaurants");
}
