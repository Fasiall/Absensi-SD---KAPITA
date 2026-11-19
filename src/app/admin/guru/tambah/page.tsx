import type { Metadata } from "next";

import { AppShell } from "@/components/AppShell";
import { FlashMessages } from "@/components/FlashMessages";
import { requireAdmin } from "@/lib/guards";
import { navFor } from "@/lib/nav";
import { takeFlash } from "@/lib/flash";
import { TeacherForm } from "../TeacherForm";
import { saveTeacherAction } from "../actions";

export const metadata: Metadata = { title: "Tambah Guru" };

/** Membaca cookie sesi — navigasi boleh memblokir. */
export const instant = false;

export default async function AddTeacherPage() {
  const user = await requireAdmin("/admin/guru");
  const flashes = await takeFlash();

  return (
    <AppShell
      user={user}
      nav={navFor(user)}
      current="/admin/guru"
      title="Tambah Guru"
      subtitle="Buat akun guru baru"
    >
      <FlashMessages messages={flashes} />
      <TeacherForm action={saveTeacherAction} />
    </AppShell>
  );
}
