import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { loginAction } from "./actions";
import { LoginForm } from "./LoginForm";
import LoginVisual from "./LoginVisual";
import { getCurrentUser, homeFor, isSafeUrl } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Masuk",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  const user = await getCurrentUser();
  if (user) redirect(homeFor(user));

  const next = typeof params.next === "string" && isSafeUrl(params.next) ? params.next : "";
  const schoolName = process.env.SCHOOL_NAME || "SD Negeri Purwodadi Simpang";
  const errorMessage = params.error === "1" ? "Nama pengguna atau kata sandi salah." : "";

  // Di layar kecil panel ilustrasi disembunyikan, jadi grid harus satu kolom
  // agar form mengisi seluruh lebar. Tanpa grid-cols-1, kolom pertama tetap
  // ada walau kosong dan form terjepit di separuh layar.
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[1.05fr_1fr]">
      <LoginVisual />

      <section className="flex items-center justify-center bg-[#F6F3F3] px-5 py-10 sm:px-10">
        <div className="w-full max-w-[420px]">
          <div className="mb-8 flex items-center justify-center gap-2 lg:hidden">
            <span className="text-sm font-semibold tracking-wide">{schoolName}</span>
          </div>

          <h2 className="text-center font-[family-name:var(--font-display)] text-[56px] leading-none font-black uppercase tracking-tight text-[#1E88C7] drop-shadow-[0_2px_0_rgba(30,136,199,0.22)] sm:text-[68px]">
            Login
          </h2>
          <p className="mt-3 text-center text-sm text-[#6B6B6B]">
            Selamat datang di aplikasi absensi
            <br />
            {schoolName}
          </p>

          <div className="mt-8">
            <LoginForm action={loginAction} error={errorMessage} next={next || undefined} />
          </div>
        </div>
      </section>
    </div>
  );
}
