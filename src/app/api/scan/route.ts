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

  const { status, body } = await processScan(user, data);
  return NextResponse.json(body, { status });
}
