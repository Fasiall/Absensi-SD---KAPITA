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
  const schoolName = process.env.SCHOOL_NAME || "SD KAPITA";
  const errorMessage = params.error === "1" ? "Nama pengguna atau kata sandi salah." : "";

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <LoginVisual />

      <section className="flex items-center justify-center bg-[#F6F3F3] px-5 py-10 sm:px-10">
        <div className="w-full max-w-[420px]">
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <span className="grid size-10 place-items-center rounded-xl bg-[#16B0F6] text-white">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M3 3h7v7H3V3Zm11 0h7v7h-7V3ZM3 14h7v7H3v-7Zm11 3h3v3h-3v-3Zm4-3h3v3h-3v-3Zm0-3h3v1h-3v-1Zm-4 3h1v3h-1v-3Z" />
              </svg>
            </span>
            <span className="text-sm font-semibold tracking-wide">{schoolName}</span>
          </div>

          <h2 className="font-[family-name:var(--font-display)] text-[40px] leading-none text-[#E099B7] sm:text-[48px]">
            Masuk
          </h2>
          <p className="mt-3 text-sm text-[#6B6B6B]">
            Selamat datang kembali di aplikasi absensi {schoolName}.
          </p>

          <div className="mt-8">
            <LoginForm action={loginAction} error={errorMessage} next={next || undefined} />
          </div>
        </div>
      </section>
    </div>
  );
}
