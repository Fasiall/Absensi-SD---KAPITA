import type { Metadata } from "next";

import { changePasswordAction } from "./actions";
import { AppShell } from "@/components/AppShell";
import { Icon } from "@/components/Icon";
import { requireLogin } from "@/lib/guards";
import { navFor } from "@/lib/nav";

export const metadata: Metadata = { title: "Ubah Kata Sandi" };

/** Membaca cookie sesi — navigasi boleh memblokir. */
export const instant = false;

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
      <div className="card card-pad-lg max-w-lg">
        {flash && (
          <div
            className={`mb-4 flex items-start gap-2.5 rounded-soft border px-3 py-2.5 text-xs leading-relaxed ${
              flash.tone === "ok"
                ? "border-ok/25 bg-ok-soft text-ok"
                : "border-bad/25 bg-bad-soft text-bad"
            }`}
          >
            <Icon
              name={flash.tone === "ok" ? "check" : "info"}
              className="mt-0.5 h-4 w-4 shrink-0"
            />
            <span className="font-medium">{flash.text}</span>
          </div>
        )}

        <form action={changePasswordAction} className="grid gap-3.5">
          <label className="field">
            <span className="field-label">Kata sandi saat ini</span>
            <input
              name="current_password"
              type="password"
              required
              autoComplete="current-password"
              className="input"
            />
          </label>
          <label className="field">
            <span className="field-label">Kata sandi baru</span>
            <input
              name="new_password"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              className="input"
            />
            <span className="field-hint">Minimal 6 karakter.</span>
          </label>
          <label className="field">
            <span className="field-label">Ulangi kata sandi baru</span>
            <input
              name="confirm_password"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              className="input"
            />
          </label>
          <button type="submit" className="btn btn-primary btn-md btn-block mt-1">
            Simpan perubahan
          </button>
        </form>
      </div>
    </AppShell>
  );
}
