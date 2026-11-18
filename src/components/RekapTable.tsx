"use client";

import Link from "next/link";

import { Icon } from "@/components/Icon";

export type RekapRow = {
  key: string;
  nis: string;
  nama: string;
  namaKelas: string;
  hadir: number;
  sakit: number;
  izin: number;
  alpa: number;
  total: number;
  percent: number;
};

export type RekapTableProps = {
  rows: RekapRow[];
  totalStudents: number;
  totalClasses: number;
  overallPercent: number;
  exportHref: string;
};

/**
 * Tabel rekap dirender sebagai Client Component.
 *
 * Alasannya bukan interaktivitas, melainkan ukuran payload: setiap baris punya
 * 9 sel dengan className panjang. Bila dirender di Server Component, seluruh
 * pohon elemen ikut diserialisasi ke RSC payload — terukur ~82 KB dari 166 KB
 * payload hanya untuk className yang berulang (satu kelas diulang 360x).
 * Dengan Client Component, yang dikirim hanya array data di atas.
 */
export function RekapTable({
  rows,
  totalStudents,
  totalClasses,
  overallPercent,
  exportHref,
}: RekapTableProps) {
  return (
    <div className="overflow-hidden rounded-card border border-line bg-surface shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-canvas text-left text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">NIS</th>
              <th className="px-4 py-3 font-medium">Nama Siswa</th>
              <th className="px-4 py-3 font-medium">Kelas</th>
              <th className="px-4 py-3 text-center font-medium">Hadir</th>
              <th className="px-4 py-3 text-center font-medium">Sakit</th>
              <th className="px-4 py-3 text-center font-medium">Izin</th>
              <th className="px-4 py-3 text-center font-medium">Alpa</th>
              <th className="px-4 py-3 text-center font-medium">Hari Efektif</th>
              <th className="px-4 py-3 font-medium">Kehadiran</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((row) => (
              <tr key={row.key}>
                <td className="px-4 py-3 font-mono text-xs text-muted">{row.nis}</td>
                <td className="px-4 py-3 font-medium text-ink">{row.nama}</td>
                <td className="px-4 py-3">
                  <span className="rounded-md border border-line bg-canvas px-2 py-1 text-xs font-medium text-ink">
                    {row.namaKelas}
                  </span>
                </td>
                <td className="px-4 py-3 text-center font-semibold text-ok">{row.hadir}</td>
                <td className="px-4 py-3 text-center text-ink">{row.sakit}</td>
                <td className="px-4 py-3 text-center text-ink">{row.izin}</td>
                <td className="px-4 py-3 text-center">
                  <span className={row.alpa ? "font-semibold text-bad" : "text-muted"}>
                    {row.alpa}
                  </span>
                </td>
                <td className="px-4 py-3 text-center text-ink">{row.total}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="w-12 text-xs text-ink">{row.percent}%</span>
                    <span className="h-1.5 w-24 overflow-hidden rounded-full bg-canvas">
                      <span
                        className="block h-full rounded-full bg-ok"
                        style={{ width: `${row.percent}%` }}
                      />
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3 text-sm text-muted">
        <span>
          {totalStudents} siswa &middot; {totalClasses} kelas &middot; kehadiran {overallPercent}%
        </span>
        <Link
          href={exportHref}
          className="inline-flex items-center gap-2 rounded-soft bg-accent px-3 py-1.5 text-xs font-medium text-white transition hover:bg-accent-strong"
        >
          <Icon name="download" className="h-4 w-4" />
          Export Excel
        </Link>
      </div>
    </div>
  );
}
