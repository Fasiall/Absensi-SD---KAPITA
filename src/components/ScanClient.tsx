"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Icon } from "@/components/Icon";

type StudentRow = {
  id: number;
  nis: string;
  nama: string;
  status: string;
  jam_masuk: string | null;
  catatan: string | null;
};

type Counts = Record<string, number> & { total: number; Belum?: number };

type ScanResponse = {
  ok: boolean;
  code?: string;
  message: string;
  student?: StudentRow;
  counts?: Counts;
};

const STATUS_OPTIONS = ["Hadir", "Sakit", "Izin", "Alpa"] as const;

const BADGE: Record<string, string> = {
  Hadir: "bg-ok-soft text-ok",
  Sakit: "bg-warn-soft text-warn",
  Izin: "bg-accent-soft text-accent",
  Alpa: "bg-bad-soft text-bad",
  Belum: "bg-canvas text-muted",
};

const PENDING_KEY = "absensi_pending_scans";

type PendingItem = { qr: string; class_id: number; tanggal: string };

function readPending(): PendingItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(PENDING_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as PendingItem[]) : [];
  } catch {
    return [];
  }
}

function writePending(items: PendingItem[]) {
  window.localStorage.setItem(PENDING_KEY, JSON.stringify(items));
}

export type ScanClientProps = {
  classId: number;
  tanggal: string;
  students: StudentRow[];
  counts: Counts;
};

export function ScanClient({ classId, tanggal, students, counts }: ScanClientProps) {
  const [rows, setRows] = useState<StudentRow[]>(students);
  const [summary, setSummary] = useState<Counts>(counts);
  const [filter, setFilter] = useState<string>("all");
  const [flash, setFlash] = useState<{ tone: string; name: string; message: string } | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<StudentRow | null>(null);
  const [note, setNote] = useState("");
  const [dialogError, setDialogError] = useState<string | null>(null);

  const scannerRef = useRef<{ stop: () => Promise<void>; clear: () => void } | null>(null);
  const lastScanRef = useRef<{ code: string; at: number }>({ code: "", at: 0 });
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setPending(readPending());
  }, []);

  useEffect(() => {
    return () => {
      if (flashTimer.current) clearTimeout(flashTimer.current);
      const scanner = scannerRef.current;
      if (scanner) {
        scanner
          .stop()
          .then(() => scanner.clear())
          .catch(() => undefined);
      }
    };
  }, []);

  const showFlash = useCallback((tone: string, name: string, message: string) => {
    setFlash({ tone, name, message });
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlash(null), 3200);
  }, []);

  const applyResult = useCallback(
    (body: ScanResponse) => {
      if (body.student) {
        const student = body.student;
        setRows((current) =>
          current.map((row) => (row.id === student.id ? { ...row, ...student } : row)),
        );
      }
      if (body.counts) setSummary(body.counts);

      const tone =
        body.code === "success" ? "ok" : body.code === "duplicate" ? "warn" : "bad";
      showFlash(tone, body.student?.nama ?? "Scan", body.message);
    },
    [showFlash],
  );

  const sendScan = useCallback(
    async (qr: string, online = true) => {
      if (!online) {
        const item: PendingItem = { qr, class_id: classId, tanggal };
        const next = [...readPending(), item];
        writePending(next);
        setPending(next);
        showFlash("warn", "Tersimpan offline", "Data akan dikirim saat kembali online.");
        return;
      }

      try {
        const response = await fetch("/api/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ qr, class_id: classId, tanggal }),
        });
        const body = (await response.json()) as ScanResponse;
        applyResult(body);
      } catch {
        const item: PendingItem = { qr, class_id: classId, tanggal };
        const next = [...readPending(), item];
        writePending(next);
        setPending(next);
        showFlash("warn", "Tersimpan offline", "Data akan dikirim saat kembali online.");
      }
    },
    [applyResult, classId, showFlash, tanggal],
  );

  const handleDecoded = useCallback(
    (code: string) => {
      const now = Date.now();
      if (lastScanRef.current.code === code && now - lastScanRef.current.at < 2500) return;
      lastScanRef.current = { code, at: now };
      void sendScan(code, typeof navigator === "undefined" ? true : navigator.onLine);
    },
    [sendScan],
  );

  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      const mod = (await import("@/lib/html5-qrcode-client")) as {
        startScanner: (
          elementId: string,
          onDecoded: (code: string) => void,
        ) => Promise<{ stop: () => Promise<void>; clear: () => void }>;
      };
      const scanner = await mod.startScanner("qr-reader", handleDecoded);
      scannerRef.current = scanner;
      setCameraOn(true);
    } catch (error) {
      setCameraError(
        error instanceof Error
          ? error.message
          : "Kamera tidak dapat diakses. Periksa izin kamera di browser Anda.",
      );
      setCameraOn(false);
    }
  }, [handleDecoded]);

  const stopCamera = useCallback(async () => {
    const scanner = scannerRef.current;
    scannerRef.current = null;
    setCameraOn(false);
    if (scanner) {
      try {
        await scanner.stop();
        scanner.clear();
      } catch {
        /* ignore */
      }
    }
  }, []);

  const syncPending = useCallback(async () => {
    const items = readPending();
    if (items.length === 0) return;
    setBusy(true);
    try {
      const response = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      const body = (await response.json()) as {
        ok: boolean;
        results?: (ScanResponse & { qr?: string })[];
      };
      if (body.ok && body.results) {
        for (const result of body.results) applyResult(result);
      }
      writePending([]);
      setPending([]);
    } catch {
      /* biarkan tersimpan */
    } finally {
      setBusy(false);
    }
  }, [applyResult]);

  const submitStatus = useCallback(
    async (status: string) => {
      if (!editing) return;
      setDialogError(null);
      setBusy(true);
      try {
        const response = await fetch("/api/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            student_id: editing.id,
            tanggal,
            status,
            catatan: note,
          }),
        });
        const body = (await response.json()) as ScanResponse;
        if (!response.ok || !body.ok) {
          setDialogError(body.message);
          return;
        }
        applyResult(body);
        setEditing(null);
        setNote("");
      } catch {
        setDialogError("Tidak dapat menyimpan status. Periksa koneksi Anda.");
      } finally {
        setBusy(false);
      }
    },
    [applyResult, editing, note, tanggal],
  );

  const percent = useMemo(() => {
    const total = summary.total || 0;
    return total ? Math.round(((summary.Hadir ?? 0) / total) * 1000) / 10 : 0;
  }, [summary]);

  const visibleRows = useMemo(() => {
    if (filter === "all") return rows;
    return rows.filter((row) => row.status === filter);
  }, [filter, rows]);

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
      <section className="grid min-w-0 grid-cols-1 gap-4">
        <div id="scan" className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <h2 className="min-w-0 flex-1 text-base font-semibold text-ink">Scan Kartu Siswa</h2>
            <span
              className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-medium ${
                cameraOn ? "bg-ok-soft text-ok" : "bg-slate-50 text-slate-400"
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {cameraOn ? "Aktif" : "Nonaktif"}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Kamera akan menyala otomatis. Pastikan pencahayaan cukup.
          </p>

          <div className="relative mt-3 overflow-hidden rounded-xl border border-slate-100 bg-black/90">
            <div id="qr-reader" className="min-h-[260px] w-full [&_*]:max-w-full [&_video]:h-auto [&_video]:w-full" />
            {!cameraOn ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-ink/80 text-center text-white">
                <Icon name="camera" className="h-8 w-8" />
                <p className="max-w-xs text-xs text-white/80">
                  {cameraError ?? "Izinkan akses kamera untuk mulai memindai kartu QR."}
                </p>
                <button
                  type="button"
                  onClick={() => void startCamera()}
                  className="inline-flex items-center gap-2 rounded-xl bg-accent px-3 py-2 text-xs font-medium text-white transition hover:bg-accent-strong"
                >
                  <Icon name="camera" className="h-4 w-4" />
                  Nyalakan Kamera
                </button>
              </div>
            ) : null}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void (cameraOn ? stopCamera() : startCamera())}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-ink transition hover:bg-slate-50"
            >
              <Icon name="camera" className="h-4 w-4" />
              {cameraOn ? "Matikan Kamera" : "Nyalakan Kamera"}
            </button>
            <span className="text-xs text-slate-500">
              Scan berjalan otomatis saat QR terdeteksi.
            </span>
          </div>

          {pending.length > 0 ? (
            <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-warn/40 bg-warn-soft px-3 py-2 text-xs text-ink">
              <Icon name="sync" className="h-4 w-4 text-warn" />
              <span>
                <strong>{pending.length} absensi menunggu sinkron.</strong> Data tersimpan di
                perangkat dan akan dikirim saat online.
              </span>
              <button
                type="button"
                disabled={busy}
                onClick={() => void syncPending()}
                className="rounded-xl bg-warn px-2.5 py-1 font-medium text-white disabled:opacity-60"
              >
                Sinkronkan
              </button>
            </div>
          ) : null}
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 sm:flex sm:items-center sm:justify-between sm:gap-4">
              <div className="min-w-0">
                <h2 className="text-base font-semibold leading-snug text-ink">
                  Ringkasan Kehadiran
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Estimasi siswa hadir pada tanggal terpilih.
                </p>
              </div>
              <div className="mt-4">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Hadir hari ini
                </span>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <strong className="text-3xl font-bold leading-none text-ink">
                    {summary.Hadir ?? 0}
                  </strong>
                  <span className="text-sm text-slate-400">/ {summary.total ?? 0} siswa</span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {summary.Belum ?? 0} siswa belum tercatat kehadirannya.
                </p>
              </div>
            </div>

            <div
              className="relative grid size-[76px] shrink-0 place-items-center rounded-full sm:size-[88px]"
              style={{
                background: `conic-gradient(var(--color-ok) ${percent * 3.6}deg, #f1f5f9 0deg)`,
              }}
              aria-label={`${percent}% siswa hadir`}
            >
              <div className="grid size-[64px] place-items-center rounded-full bg-white sm:size-[76px]">
                <div className="text-center leading-none">
                  <div className="text-sm font-bold text-ink sm:text-base">{percent}%</div>
                  <div className="mt-1 text-[9px] text-slate-400">dari total</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2.5 border-t border-slate-100 pt-4">
            <div className="rounded-xl bg-ok-soft px-3 py-2.5">
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-ok">
                <Icon name="check" className="h-3.5 w-3.5" />
                Hadir
              </div>
              <div className="mt-1 text-lg font-bold text-ink">{summary.Hadir ?? 0}</div>
            </div>
            <div className="rounded-xl bg-accent-soft px-3 py-2.5">
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-accent">
                <Icon name="reports" className="h-3.5 w-3.5" />
                Izin
              </div>
              <div className="mt-1 text-lg font-bold text-ink">{summary.Izin ?? 0}</div>
            </div>
            <div className="rounded-xl bg-warn-soft px-3 py-2.5">
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-warn">
                <Icon name="info" className="h-3.5 w-3.5" />
                Sakit
              </div>
              <div className="mt-1 text-lg font-bold text-ink">{summary.Sakit ?? 0}</div>
            </div>
            <div className="rounded-xl bg-bad-soft px-3 py-2.5">
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-bad">
                <Icon name="x" className="h-3.5 w-3.5" />
                Alpa
              </div>
              <div className="mt-1 text-lg font-bold text-ink">{summary.Alpa ?? 0}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="min-w-0 rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3">
          <div>
            <h2 className="text-base font-semibold text-ink">Daftar Siswa</h2>
            <p className="mt-0.5 text-xs text-slate-500">{rows.length} siswa</p>
          </div>
          <div className="flex gap-1">
            {["all", "Belum", "Hadir"].map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                  filter === key
                    ? "bg-accent text-white"
                    : "border border-slate-200 text-slate-500 hover:bg-slate-50"
                }`}
              >
                {key === "all" ? "Semua" : key}
              </button>
            ))}
          </div>
        </div>

        <ul className="max-h-[560px] divide-y divide-slate-100 overflow-y-auto">
          {visibleRows.map((row) => (
            <li key={row.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
              <div className="min-w-0">
                <strong className="block truncate text-sm text-ink">{row.nama}</strong>
                <span className="text-xs text-slate-500">NIS {row.nis}</span>
                {row.catatan ? (
                  <small className="mt-0.5 block truncate text-xs italic text-slate-500">
                    {row.catatan}
                  </small>
                ) : null}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span
                  className={`rounded-full px-2 py-1 text-xs font-medium ${
                    BADGE[row.status] ?? BADGE.Belum
                  }`}
                >
                  {row.status}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(row);
                    setNote(row.catatan ?? "");
                    setDialogError(null);
                  }}
                  className="rounded-xl border border-slate-200 px-2 py-1 text-xs font-medium text-ink transition hover:bg-slate-50"
                >
                  Ubah
                </button>
              </div>
            </li>
          ))}
          {visibleRows.length === 0 ? (
            <li className="px-4 py-10 text-center text-sm text-muted">
              Belum ada siswa aktif
            </li>
          ) : null}
        </ul>
      </section>

      {flash ? (
        <div className="pointer-events-none fixed inset-x-4 bottom-4 z-50 mx-auto max-w-sm rounded-card border border-line bg-surface p-4 shadow-lg">
          <div className="flex items-start gap-3">
            <span
              className={`mt-0.5 rounded-full p-1.5 ${
                flash.tone === "ok"
                  ? "bg-ok-soft text-ok"
                  : flash.tone === "warn"
                    ? "bg-warn-soft text-warn"
                    : "bg-bad-soft text-bad"
              }`}
            >
              <Icon
                name={flash.tone === "ok" ? "check" : flash.tone === "warn" ? "info" : "x"}
                className="h-4 w-4"
              />
            </span>
            <div className="min-w-0">
              <strong className="block text-sm text-ink">{flash.name}</strong>
              <p className="text-xs text-muted">{flash.message}</p>
            </div>
          </div>
        </div>
      ) : null}

      {editing ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-card border border-line bg-surface p-4 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted">Ubah Status Manual</p>
                <h2 className="font-display text-base text-ink">{editing.nama}</h2>
              </div>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded-soft p-1 text-muted transition hover:bg-canvas"
                aria-label="Tutup"
              >
                <Icon name="x" className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-1 text-xs text-muted">
              Ketuk salah satu status. Perubahan langsung disimpan.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {STATUS_OPTIONS.map((status) => (
                <button
                  key={status}
                  type="button"
                  disabled={busy}
                  onClick={() => void submitStatus(status)}
                  className="flex items-center gap-2 rounded-soft border border-line px-3 py-2 text-sm font-medium text-ink transition hover:bg-canvas disabled:opacity-60"
                >
                  <Icon
                    name={
                      status === "Hadir"
                        ? "check"
                        : status === "Alpa"
                          ? "x"
                          : status === "Izin"
                            ? "reports"
                            : "info"
                    }
                    className="h-4 w-4"
                  />
                  {status}
                </button>
              ))}
            </div>
            <label className="mt-3 grid gap-1.5 text-sm">
              <span className="font-medium text-ink">
                Catatan <span className="text-muted">(opsional)</span>
              </span>
              <input
                type="text"
                maxLength={255}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Contoh: Surat dokter"
                className="rounded-soft border border-line bg-canvas px-3 py-2 text-sm text-ink"
              />
            </label>
            {dialogError ? <p className="mt-2 text-xs text-bad">{dialogError}</p> : null}
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="mt-3 w-full rounded-soft border border-line px-3 py-2 text-sm font-medium text-ink transition hover:bg-canvas"
            >
              Batal
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
