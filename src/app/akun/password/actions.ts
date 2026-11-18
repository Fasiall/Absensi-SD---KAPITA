"use server";

import { redirect } from "next/navigation";

import { prisma } from "@/lib/db";
import { clearSessionCookie, getCurrentUser } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/password";

export async function changePasswordAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=%2Fakun%2Fpassword");

  const current = String(formData.get("current_password") ?? "");
  const next = String(formData.get("new_password") ?? "");
  const confirm = String(formData.get("confirm_password") ?? "");

  const fail = (code: string) => redirect(`/akun/password?error=${code}`);

  if (!current || !next || !confirm) fail("empty");
  if (next.length < 6) fail("short");
  if (next !== confirm) fail("mismatch");

  const record = await prisma.user.findUnique({
    where: { id: user.id },
    select: { passwordHash: true },
  });
  if (!record) {
    await clearSessionCookie();
    redirect("/login");
  }
  const valid = await verifyPassword(current, record.passwordHash);
  if (!valid) fail("wrong");

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(next) },
  });

  redirect("/akun/password?ok=1");
}
