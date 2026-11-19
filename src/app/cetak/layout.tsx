import type { ReactNode } from "react";
import { headers } from "next/headers";

import { AppShell } from "@/components/AppShell";
import { navFor } from "@/lib/nav";
import { requireLogin } from "@/lib/guards";

/** Shell untuk halaman cetak (admin & guru sama-sama boleh akses). */
export default async function CetakLayout({ children }: { children: ReactNode }) {
  const user = await requireLogin("/cetak");
  const pathname = (await headers()).get("x-pathname") ?? "/cetak";

  return (
    <AppShell
      user={user}
      nav={navFor(user)}
      current={pathname}
      title="Cetak Kartu"
      hideTitle
    >
      {children}
    </AppShell>
  );
}
