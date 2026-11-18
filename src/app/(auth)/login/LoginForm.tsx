"use client";

import { useState } from "react";
import { Icon } from "@/components/Icon";

type Props = {
  action: (formData: FormData) => void | Promise<void>;
  defaultUsername?: string;
  error?: string;
  next?: string;
};

export function LoginForm({ action, defaultUsername = "", error, next }: Props) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={action} className="grid gap-4">
      {next && <input type="hidden" name="next" value={next} />}

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-bad"
        >
          {error}
        </div>
      )}

      <label className="grid gap-2">
        <span className="text-sm font-medium text-ink">Nama pengguna</span>
        <span className="relative">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted">
            <Icon name="user" size={18} />
          </span>
          <input
            id="username"
            name="username"
            type="text"
            required
            autoComplete="username"
            autoFocus
            defaultValue={defaultUsername}
            placeholder="Masukkan nama pengguna"
            className="h-12 w-full rounded-[20px] border border-[#E6E6E6] bg-[#FBFBFB] pl-11 pr-4 text-sm text-ink outline-none transition focus:border-[#16B0F6] focus:bg-white"
          />
        </span>
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-medium text-ink">Kata sandi</span>
        <span className="relative">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted">
            <Icon name="lock" size={18} />
          </span>
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            placeholder="Masukkan kata sandi"
            className="h-12 w-full rounded-[20px] border border-[#E6E6E6] bg-[#FBFBFB] pl-11 pr-12 text-sm text-ink outline-none transition focus:border-[#16B0F6] focus:bg-white"
          />
          <button
            type="button"
            id="togglePassword"
            onClick={() => setShowPassword((open) => !open)}
            className="absolute right-3 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-muted transition hover:bg-[#F1F1F1] hover:text-ink"
            aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
          >
            <Icon name={showPassword ? "eye-off" : "eye"} size={18} />
          </button>
        </span>
      </label>

      <label className="flex items-center gap-2 text-sm text-muted">
        <input
          type="checkbox"
          name="remember"
          value="1"
          className="size-4 rounded border-[#D6D6D6] accent-[#16B0F6]"
        />
        Ingat saya di perangkat ini
      </label>

      <button
        type="submit"
        className="mt-1 h-12 rounded-[40px] bg-[#F095B1] text-sm font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-[#E8809F] active:scale-[0.99]"
      >
        Masuk
      </button>

      <p className="text-center text-xs text-muted">
        Lupa kata sandi? Hubungi admin sekolah untuk pengaturan ulang.
      </p>
    </form>
  );
}
