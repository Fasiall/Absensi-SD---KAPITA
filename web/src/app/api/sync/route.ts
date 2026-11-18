import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { processScan } from "@/lib/scan";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, code: "auth", message: "Sesi berakhir. Muat ulang halaman lalu masuk kembali." },
      { status: 401 },
    );
  }
  if (user.role !== "guru" && user.role !== "admin") {
    return NextResponse.json(
      { ok: false, code: "forbidden", message: "Anda tidak punya akses ke fitur ini." },
      { status: 403 },
    );
  }

  let data: Record<string, unknown> = {};
  try {
    data = (await request.json()) as Record<string, unknown>;
  } catch {
    data = {};
  }

  const items = Array.isArray(data.items) ? data.items : [];
  if (items.length === 0) {
    return NextResponse.json(
      { ok: false, code: "invalid", message: "Tidak ada data untuk disinkronkan." },
      { status: 400 },
    );
  }

  const results: Record<string, unknown>[] = [];
  for (const item of items.slice(0, 100)) {
    if (!item || typeof item !== "object") {
      results.push({ ok: false, code: "invalid", message: "Data tidak valid.", qr: "" });
      continue;
    }
    const row = item as Record<string, unknown>;
    const { body } = await processScan(user, row);
    results.push({ ...body, qr: String(row.qr ?? "") });
  }

  return NextResponse.json({ ok: true, results, synced: results.length });
}
