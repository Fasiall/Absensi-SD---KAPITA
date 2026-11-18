import type { ReactNode } from "react";
import { headers } from "next/headers";

import { AppShell } from "@/components/AppShell";
import { navFor } from "@/lib/nav";
import { requireStaff } from "@/lib/guards";

/** Shell bersama untuk semua halaman guru: navigasi ditangani di satu tempat. */
export default async function GuruLayout({ children }: { children: ReactNode }) {
  const user = await requireStaff("/guru");
  const pathname = (await headers()).get("x-pathname") ?? "/guru/scan";

  return (
    <AppShell
      user={user}
      nav={navFor(user)}
      current={pathname}
      title="Absensi Guru"
      subtitle={process.env.SCHOOL_NAME || "SD KAPITA"}
    >
      {children}
    </AppShell>
  );
}
