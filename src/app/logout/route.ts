import { redirect } from "next/navigation";

import { clearSessionCookie, getCurrentUser, homeFor } from "@/lib/auth";

export async function POST() {
  await clearSessionCookie();
  redirect("/login");
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    await clearSessionCookie();
    redirect("/login");
  }
  redirect(homeFor(user));
}
