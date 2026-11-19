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
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="table-head border-b border-line bg-canvas text-left">
            <tr>
              <th className="px-4 py-2.5">NIS</th>
              <th className="px-4 py-2.5">Nama Siswa</th>
              <th className="px-4 py-2.5">Kelas</th>
              <th className="px-4 py-2.5 text-center">Hadir</th>
              <th className="px-4 py-2.5 text-center">Sakit</th>
              <th className="px-4 py-2.5 text-center">Izin</th>
              <th className="px-4 py-2.5 text-center">Alpa</th>
              <th className="px-4 py-2.5 text-center">Hari Efektif</th>
              <th className="px-4 py-2.5">Kehadiran</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((row) => (
              <tr key={row.key} className="transition-colors hover:bg-canvas/60">
                <td className="px-4 py-2.5 font-mono text-xs text-muted">{row.nis}</td>
                <td className="px-4 py-2.5 font-medium text-ink">{row.nama}</td>
                <td className="px-4 py-2.5">
                  <span className="badge badge-neutral">{row.namaKelas}</span>
                </td>
                <td className="px-4 py-2.5 text-center font-semibold tabular-nums text-ok">
                  {row.hadir}
                </td>
                <td className="px-4 py-2.5 text-center tabular-nums text-ink">{row.sakit}</td>
                <td className="px-4 py-2.5 text-center tabular-nums text-ink">{row.izin}</td>
                <td className="px-4 py-2.5 text-center tabular-nums">
                  <span className={row.alpa ? "font-semibold text-bad" : "text-muted"}>
                    {row.alpa}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-center tabular-nums text-ink">{row.total}</td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-11 text-xs tabular-nums text-ink">{row.percent}%</span>
                    <span className="h-1.5 w-20 overflow-hidden rounded-full bg-canvas">
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
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3 text-xs text-muted">
        <span>
          {totalStudents} siswa &middot; {totalClasses} kelas &middot; kehadiran {overallPercent}%
        </span>
        <Link href={exportHref} className="btn btn-primary btn-sm">
          <Icon name="download" className="h-4 w-4" />
          Export Excel
        </Link>
      </div>
    </div>
  );
}
