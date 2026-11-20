"use client";

import { useState } from "react";

type Props = {
  action: (formData: FormData) => void | Promise<void>;
  values?: { id?: number; nama: string; username: string; aktif: boolean };
  mode?: "create" | "edit";
};

export function TeacherForm({ action, values, mode = "create" }: Props) {
  const [aktif, setAktif] = useState(values?.aktif ?? true);

  return (
    <form action={action} className="card card-pad-lg grid max-w-md gap-3.5">
      {mode === "edit" && values?.id ? (
        <input type="hidden" name="id" value={values.id} />
      ) : null}

      <label className="field">
        <span className="field-label">Nama guru</span>
        <input
          name="nama"
          defaultValue={values?.nama ?? ""}
          required
          maxLength={100}
          className="input"
        />
      </label>

      <label className="field">
        <span className="field-label">Username</span>
        <input
          name="username"
          defaultValue={values?.username ?? ""}
          required
          maxLength={50}
          autoComplete="off"
          className="input"
        />
        <span className="field-hint">Tanpa spasi. Digunakan untuk login.</span>
      </label>

      <label className="field">
        <span className="field-label">
          Password{" "}
          {mode === "edit" && (
            <span className="font-normal text-muted">(kosongkan bila tidak diubah)</span>
          )}
        </span>
        <input
          name="password"
          type="password"
          required={mode === "create"}
          minLength={6}
          autoComplete="new-password"
          className="input"
        />
      </label>

      <label className="flex items-center gap-2 text-sm text-ink">
        <input
          name="aktif"
          type="checkbox"
          checked={aktif}
          onChange={(event) => setAktif(event.target.checked)}
          className="size-4 rounded border-line accent-accent"
        />
        Akun aktif
      </label>

      <div className="mt-1 flex items-center gap-2">
        <button type="submit" className="btn btn-primary btn-md flex-1">
          {mode === "edit" ? "Simpan perubahan" : "Simpan akun guru"}
        </button>
        <a href="/admin/guru" className="btn btn-ghost btn-md">
          Batal
        </a>
      </div>
    </form>
  );
}
