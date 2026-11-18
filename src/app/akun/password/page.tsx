import type { Metadata } from "next";

import { changePasswordAction } from "./actions";
import { AppShell } from "@/components/AppShell";
import { requireLogin } from "@/lib/guards";
import { navFor } from "@/lib/nav";

export const metadata: Metadata = { title: "Ubah Kata Sandi" };

const messages: Record<string, { tone: "ok" | "bad"; text: string }> = {
  empty: { tone: "bad", text: "Semua kolom wajib diisi." },
  short: { tone: "bad", text: "Kata sandi baru minimal 6 karakter." },
  mismatch: { tone: "bad", text: "Konfirmasi kata sandi tidak sama." },
  wrong: { tone: "bad", text: "Kata sandi saat ini salah." },
  ok: { tone: "ok", text: "Kata sandi berhasil diperbarui." },
};

export default async function PasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const user = await requireLogin("/akun/password");
  const params = await searchParams;
  const key = params.ok === "1" ? "ok" : params.error;
  const flash = key ? messages[key] : undefined;

  return (
    <AppShell
      user={user}
      nav={navFor(user)}
      current="/akun/password"
      title="Ubah Kata Sandi"
      subtitle="Gunakan kata sandi yang kuat dan mudah Anda ingat."
    >
      <div className="max-w-lg rounded-2xl border border-line bg-surface p-6 shadow-sm">
        {flash && (
          <div
            className={`mb-4 rounded-xl border px-4 py-3 text-sm ${
              flash.tone === "ok"
                ? "border-green-200 bg-green-50 text-ok"
                : "border-red-200 bg-red-50 text-bad"
            }`}
          >
            {flash.text}
          </div>
        )}

        <form action={changePasswordAction} className="grid gap-4">
          <label className="grid gap-2">
            <span className="text-sm font-medium">Kata sandi saat ini</span>
            <input
              name="current_password"
              type="password"
              required
              autoComplete="current-password"
              className="h-11 rounded-xl border border-line bg-white px-3 text-sm outline-none focus:border-accent"
            />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium">Kata sandi baru</span>
            <input
              name="new_password"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              className="h-11 rounded-xl border border-line bg-white px-3 text-sm outline-none focus:border-accent"
            />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium">Ulangi kata sandi baru</span>
            <input
              name="confirm_password"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              className="h-11 rounded-xl border border-line bg-white px-3 text-sm outline-none focus:border-accent"
            />
          </label>
          <button
            type="submit"
            className="mt-2 h-11 rounded-xl bg-accent text-sm font-semibold text-white transition hover:bg-accent-strong"
          >
            Simpan perubahan
          </button>
        </form>
      </div>
    </AppShell>
  );
}
