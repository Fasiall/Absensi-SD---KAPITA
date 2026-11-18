"use client";

import { useState } from "react";

import { Icon } from "@/components/Icon";
import type { Flash } from "@/lib/flash";

type ClassOption = { id: number; namaKelas: string };

type Props = {
  action: (formData: FormData) => void | Promise<void>;
  classes: ClassOption[];
  values: { nis: string; nama: string; class_id: string; aktif: boolean };
  student?: { id: number; qrCode: string } | null;
  qrPreview?: string | null;
  flashes: Flash[];
};

export function StudentForm({ action, classes, values, student, qrPreview, flashes }: Props) {
  const [aktif, setAktif] = useState(values.aktif);

  return (
    <form action={action} className="grid gap-5">
      {student && <input type="hidden" name="id" value={student.id} />}

      {flashes.length > 0 && (
        <div className="grid gap-2">
          {flashes.map((flash, index) => (
            <div
              key={index}
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-bad"
            >
              {flash.message}
            </div>
          ))}
        </div>
      )}

      <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-medium">NIS</span>
            <input
              name="nis"
              defaultValue={values.nis}
              required
              maxLength={30}
              className="h-11 rounded-xl border border-line bg-white px-3 text-sm outline-none focus:border-accent"
            />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium">Nama siswa</span>
            <input
              name="nama"
              defaultValue={values.nama}
              required
              maxLength={100}
              className="h-11 rounded-xl border border-line bg-white px-3 text-sm outline-none focus:border-accent"
            />
          </label>
          <label className="grid gap-2 sm:col-span-2">
            <span className="text-sm font-medium">Kelas</span>
            <select
              name="class_id"
              defaultValue={values.class_id}
              required
              className="h-11 rounded-xl border border-line bg-white px-3 text-sm outline-none focus:border-accent"
            >
              <option value="">— Pilih kelas —</option>
              {classes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.namaKelas}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="mt-4 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="aktif"
            value="1"
            checked={aktif}
            onChange={(event) => setAktif(event.target.checked)}
            className="size-4 accent-accent"
          />
          Siswa aktif (dapat dipindai)
        </label>

        {student && (
          <label className="mt-2 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="regenerate_qr"
              value="1"
              className="size-4 accent-accent"
            />
            Buat ulang kode QR
          </label>
        )}
      </div>

      {qrPreview && (
        <div className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-5 shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrPreview} alt="Kode QR siswa" width={112} height={112} className="rounded-xl" />
          <div className="text-sm text-muted">
            <div className="font-medium text-ink">Kode QR saat ini</div>
            <p className="mt-1">
              Cetak kartu absensi dari menu <strong>Kartu</strong> agar QR siap dipakai.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-accent px-5 text-sm font-semibold text-white transition hover:bg-accent-strong"
        >
          <Icon name="check" size={18} /> Simpan
        </button>
        <a
          href="/admin/siswa"
          className="inline-flex h-11 items-center rounded-xl border border-line bg-surface px-5 text-sm font-medium transition hover:border-accent hover:text-accent"
        >
          Batal
        </a>
      </div>
    </form>
  );
}
