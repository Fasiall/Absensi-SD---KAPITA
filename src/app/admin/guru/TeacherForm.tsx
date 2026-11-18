"use client";

import { useState } from "react";

type Props = {
  action: (formData: FormData) => void | Promise<void>;
  values?: { nama: string; username: string; aktif: boolean };
  mode?: "create" | "edit";
};

export function TeacherForm({ action, values, mode = "create" }: Props) {
  const [aktif, setAktif] = useState(values?.aktif ?? true);

  return (
    <form action={action} className="grid max-w-md gap-4 rounded-2xl border border-line bg-surface p-5 shadow-sm">
      <label className="grid gap-2">
        <span className="text-sm font-medium">Nama guru</span>
        <input
          name="nama"
          defaultValue={values?.nama ?? ""}
          required
          maxLength={100}
          className="h-11 rounded-xl border border-line bg-white px-3 text-sm outline-none focus:border-accent"
        />
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-medium">Username</span>
        <input
          name="username"
          defaultValue={values?.username ?? ""}
          required
          maxLength={50}
          autoComplete="off"
          className="h-11 rounded-xl border border-line bg-white px-3 text-sm outline-none focus:border-accent"
        />
        <span className="text-xs text-muted">Tanpa spasi. Digunakan untuk login.</span>
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-medium">
          Password {mode === "edit" && <span className="text-muted">(kosongkan bila tidak diubah)</span>}
        </span>
        <input
          name="password"
          type="password"
          required={mode === "create"}
          minLength={6}
          autoComplete="new-password"
          className="h-11 rounded-xl border border-line bg-white px-3 text-sm outline-none focus:border-accent"
        />
      </label>

      <label className="flex items-center gap-2 text-sm">
        <input
          name="aktif"
          type="checkbox"
          checked={aktif}
          onChange={(event) => setAktif(event.target.checked)}
          className="size-4 rounded border-line"
        />
        Akun aktif
      </label>

      <div className="flex items-center gap-2 pt-2">
        <button
          type="submit"
          className="h-11 flex-1 rounded-xl bg-accent text-sm font-semibold text-white transition hover:bg-accent-strong"
        >
          {mode === "edit" ? "Simpan perubahan" : "Simpan akun guru"}
        </button>
        <a
          href="/admin/guru"
          className="grid h-11 place-items-center rounded-xl border border-line px-4 text-sm font-medium text-muted transition hover:bg-canvas"
        >
          Batal
        </a>
      </div>
    </form>
  );
}
