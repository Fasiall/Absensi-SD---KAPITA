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
  Hadir: "badge-ok",
  Sakit: "badge-warn",
  Izin: "badge-accent",
  Alpa: "badge-bad",
  Belum: "badge-neutral",
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
        <div id="scan" className="card card-pad">
          <div className="flex items-start justify-between gap-2">
            <h2 className="section-title min-w-0 flex-1">Scan Kartu Siswa</h2>
            <span className={`badge shrink-0 ${cameraOn ? "badge-ok" : "badge-neutral"}`}>
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {cameraOn ? "Aktif" : "Nonaktif"}
            </span>
          </div>
          <p className="section-subtitle">
            Kamera akan menyala otomatis. Pastikan pencahayaan cukup.
          </p>

          <div className="relative mt-3 overflow-hidden rounded-soft border border-line bg-ink">
            <div id="qr-reader" className="min-h-[260px] w-full [&_*]:max-w-full [&_video]:h-auto [&_video]:w-full" />
            {!cameraOn ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-ink/85 px-4 text-center text-white">
                <Icon name="camera" className="h-8 w-8" />
                <p className="max-w-xs text-xs leading-relaxed text-white/80">
                  {cameraError ?? "Izinkan akses kamera untuk mulai memindai kartu QR."}
                </p>
                <button
                  type="button"
                  onClick={() => void startCamera()}
                  className="btn btn-primary btn-sm"
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
              className="btn btn-secondary btn-sm"
            >
              <Icon name="camera" className="h-4 w-4" />
              {cameraOn ? "Matikan Kamera" : "Nyalakan Kamera"}
            </button>
            <span className="text-xs text-muted">
              Scan berjalan otomatis saat QR terdeteksi.
            </span>
          </div>

          {pending.length > 0 ? (
            <div className="mt-3 flex flex-wrap items-center gap-2 rounded-soft border border-warn/30 bg-warn-soft px-3 py-2 text-xs text-ink">
              <Icon name="sync" className="h-4 w-4 text-warn" />
              <span className="min-w-0 flex-1">
                <strong>{pending.length} absensi menunggu sinkron.</strong> Tersimpan di perangkat.
              </span>
              <button
                type="button"
                disabled={busy}
                onClick={() => void syncPending()}
                className="btn btn-sm btn-primary"
              >
                Sinkronkan
              </button>
            </div>
          ) : null}
        </div>

        <div className="card card-pad-lg">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h2 className="section-title">Ringkasan Kehadiran</h2>
              <p className="section-subtitle">Siswa hadir pada tanggal terpilih.</p>

              <div className="mt-4 flex items-baseline gap-1.5">
                <span className="stat-value text-[2rem]">{summary.Hadir ?? 0}</span>
                <span className="text-sm text-subtle">/ {summary.total ?? 0} siswa</span>
              </div>
              <p className="mt-1.5 text-xs text-muted">
                {summary.Belum ?? 0} siswa belum tercatat.
              </p>
            </div>

            <div
              className="relative grid size-[84px] shrink-0 place-items-center rounded-full"
              style={{
                background: `conic-gradient(var(--color-ok) ${percent * 3.6}deg, var(--color-canvas) 0deg)`,
              }}
              aria-label={`${percent}% siswa hadir`}
            >
              <div className="grid size-[66px] place-items-center rounded-full bg-surface">
                <div className="text-center leading-none">
                  <div className="text-base font-bold tabular-nums text-ink">{percent}%</div>
                  <div className="mt-1 text-[10px] font-medium text-subtle">hadir</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2 border-t border-line pt-4">
            <div className="rounded-soft bg-ok-soft px-3 py-2.5">
              <div className="stat-label flex items-center gap-1.5 text-ok">
                <Icon name="check" className="h-3.5 w-3.5" />
                Hadir
              </div>
              <div className="mt-1.5 text-lg font-bold tabular-nums text-ink">
                {summary.Hadir ?? 0}
              </div>
            </div>
            <div className="rounded-soft bg-accent-soft px-3 py-2.5">
              <div className="stat-label flex items-center gap-1.5 text-accent">
                <Icon name="reports" className="h-3.5 w-3.5" />
                Izin
              </div>
              <div className="mt-1.5 text-lg font-bold tabular-nums text-ink">
                {summary.Izin ?? 0}
              </div>
            </div>
            <div className="rounded-soft bg-warn-soft px-3 py-2.5">
              <div className="stat-label flex items-center gap-1.5 text-warn">
                <Icon name="info" className="h-3.5 w-3.5" />
                Sakit
              </div>
              <div className="mt-1.5 text-lg font-bold tabular-nums text-ink">
                {summary.Sakit ?? 0}
              </div>
            </div>
            <div className="rounded-soft bg-bad-soft px-3 py-2.5">
              <div className="stat-label flex items-center gap-1.5 text-bad">
                <Icon name="x" className="h-3.5 w-3.5" />
                Alpa
              </div>
              <div className="mt-1.5 text-lg font-bold tabular-nums text-ink">
                {summary.Alpa ?? 0}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="card min-w-0 overflow-hidden">
        <div className="flex items-start justify-between gap-3 border-b border-line px-4 py-3">
          <div className="min-w-0">
            <h2 className="section-title">Daftar Siswa</h2>
            <p className="section-subtitle">{rows.length} siswa</p>
          </div>
          <div className="flex shrink-0 gap-1">
            {["all", "Belum", "Hadir"].map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={`badge ${
                  filter === key
                    ? "bg-accent text-white"
                    : "badge-neutral hover:bg-line"
                }`}
              >
                {key === "all" ? "Semua" : key}
              </button>
            ))}
          </div>
        </div>

        <ul className="max-h-[560px] divide-y divide-line overflow-y-auto">
          {visibleRows.map((row) => (
            <li key={row.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
              <div className="min-w-0">
                <strong className="block truncate text-sm font-semibold text-ink">{row.nama}</strong>
                <span className="text-xs text-muted">NIS {row.nis}</span>
                {row.catatan ? (
                  <small className="mt-0.5 block truncate text-xs italic text-muted">
                    {row.catatan}
                  </small>
                ) : null}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className={`badge ${BADGE[row.status] ?? BADGE.Belum}`}>
                  {row.status}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(row);
                    setNote(row.catatan ?? "");
                    setDialogError(null);
                  }}
                  className="btn btn-secondary btn-sm"
                >
                  Ubah
                </button>
              </div>
            </li>
          ))}
          {visibleRows.length === 0 ? (
            <li className="px-4 py-10 text-center text-sm text-muted">Belum ada siswa aktif</li>
          ) : null}
        </ul>
      </section>

      {flash ? (
        <div className="pointer-events-none fixed inset-x-4 bottom-4 z-50 mx-auto max-w-sm rounded-card border border-line bg-surface p-4 shadow-lg">
          <div className="flex items-start gap-3">
            <span
              className={`mt-0.5 grid size-7 shrink-0 place-items-center rounded-full ${
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
              <p className="mt-0.5 text-xs text-muted">{flash.message}</p>
            </div>
          </div>
        </div>
      ) : null}

      {editing ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-card border border-line bg-surface p-4 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="eyebrow">Ubah status manual</p>
                <h2 className="section-title mt-1 truncate">{editing.nama}</h2>
              </div>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="btn-icon shrink-0"
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
                  className="btn btn-secondary"
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
            <label className="field mt-3">
              <span className="field-label">
                Catatan <span className="font-normal text-muted">(opsional)</span>
              </span>
              <input
                type="text"
                maxLength={255}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Contoh: Surat dokter"
                className="input"
              />
            </label>
            {dialogError ? <p className="mt-2 text-xs text-bad">{dialogError}</p> : null}
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="btn btn-ghost btn-block mt-3"
            >
              Batal
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
