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
    <form action={action} className="grid gap-4">
      {student && <input type="hidden" name="id" value={student.id} />}

      {flashes.length > 0 && (
        <div className="grid gap-2">
          {flashes.map((flash, index) => (
            <div
              key={index}
              className="flex items-start gap-2.5 rounded-soft border border-bad/25 bg-bad-soft px-3 py-2.5 text-xs leading-relaxed text-bad"
            >
              <Icon name="info" className="mt-0.5 h-4 w-4 shrink-0" />
              <span className="font-medium">{flash.message}</span>
            </div>
          ))}
        </div>
      )}

      <div className="card card-pad-lg">
        <div className="grid gap-3.5 sm:grid-cols-2">
          <label className="field">
            <span className="field-label">NIS</span>
            <input
              name="nis"
              defaultValue={values.nis}
              required
              maxLength={30}
              className="input"
            />
          </label>
          <label className="field">
            <span className="field-label">Nama siswa</span>
            <input
              name="nama"
              defaultValue={values.nama}
              required
              maxLength={100}
              className="input"
            />
          </label>
          <label className="field sm:col-span-2">
            <span className="field-label">Kelas</span>
            <select name="class_id" defaultValue={values.class_id} required className="select">
              <option value="">— Pilih kelas —</option>
              {classes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.namaKelas}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-4 grid gap-2 border-t border-line pt-3.5">
          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              name="aktif"
              value="1"
              checked={aktif}
              onChange={(event) => setAktif(event.target.checked)}
              className="size-4 rounded border-line accent-accent"
            />
            Siswa aktif (dapat dipindai)
          </label>

          {student && (
            <label className="flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                name="regenerate_qr"
                value="1"
                className="size-4 rounded border-line accent-accent"
              />
              Buat ulang kode QR
            </label>
          )}
        </div>
      </div>

      {qrPreview && (
        <div className="card card-pad-lg flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrPreview}
            alt="Kode QR siswa"
            width={104}
            height={104}
            className="shrink-0 rounded-soft border border-line"
          />
          <div className="min-w-0 text-xs leading-relaxed text-muted">
            <div className="text-sm font-semibold text-ink">Kode QR saat ini</div>
            <p className="mt-1">
              Cetak kartu absensi dari menu <strong className="text-ink">Kartu</strong> agar QR
              siap dipakai.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button type="submit" className="btn btn-primary btn-md">
          <Icon name="check" size={18} /> Simpan
        </button>
        <a href="/admin/siswa" className="btn btn-ghost btn-md">
          Batal
        </a>
      </div>
    </form>
  );
}
