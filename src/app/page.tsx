import { redirect } from "next/navigation";

import { getCurrentUser, homeFor } from "@/lib/auth";

export default async function RootPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  redirect(homeFor(user));
}
