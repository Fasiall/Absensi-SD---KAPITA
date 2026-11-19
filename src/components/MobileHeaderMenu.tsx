"use client";

import { useEffect, useState } from "react";

import { Icon } from "@/components/Icon";
import type { NavItem } from "@/components/AppShell";

type Props = {
  nav: NavItem[];
  current: string;
  user: { nama: string; username: string; role: "admin" | "guru" };
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/**
 * Tombol menu + avatar profil di kanan top navbar (khusus mobile).
 * Membuka panel navigasi penuh, akses ubah kata sandi, dan tombol keluar.
 */
export function MobileHeaderMenu({ nav, current, user }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const roleLabel = user.role === "admin" ? "Administrator" : "Guru";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Buka menu"
        className="grid size-10 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100"
      >
        <Icon name="classes" size={22} />
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Tutup menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />
          <div className="absolute inset-x-0 top-0 rounded-b-3xl bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-full bg-accent-soft text-sm font-bold text-accent">
                  {initials(user.nama)}
                </span>
                <div className="leading-tight">
                  <div className="text-sm font-semibold text-ink">{user.nama}</div>
                  <div className="text-xs text-slate-500">{roleLabel}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Tutup"
                className="grid size-9 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100"
              >
                <Icon name="x" size={20} />
              </button>
            </div>

            <nav className="mt-4 grid gap-1">
              {nav.map((item) => {
                const active = current === item.href || current.startsWith(`${item.href}/`);
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                      active
                        ? "bg-accent-soft text-accent"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Icon name={item.icon} size={18} />
                    {item.label}
                  </a>
                );
              })}
            </nav>

            <div className="mt-4 grid gap-2 border-t border-slate-100 pt-4">
              <a
                href="/akun/password"
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                <Icon name="password" size={18} />
                Ubah kata sandi
              </a>
              <form action="/logout" method="post">
                <button
                  type="submit"
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-bad transition hover:bg-red-50"
                >
                  <Icon name="logout" size={18} />
                  Keluar
                </button>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
