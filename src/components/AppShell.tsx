"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Icon, type IconName } from "@/components/Icon";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { MobileHeaderMenu } from "@/components/MobileHeaderMenu";

export type NavItem = {
  href: string;
  label: string;
  icon: IconName;
};

type Props = {
  user: { nama: string; username: string; role: "admin" | "guru" };
  nav: NavItem[];
  current: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  /** Label kecil uppercase di atas judul, mis. "Absensi SD Negeri Purwodadi Simpang". */
  eyebrow?: string;
  /** Sembunyikan blok judul (untuk halaman yang punya hero sendiri). */
  hideTitle?: boolean;
  children: ReactNode;
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function AppShell({
  user,
  nav,
  current,
  title,
  subtitle,
  actions,
  eyebrow,
  hideTitle,
  children,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const active = useMemo(
    () => nav.find((item) => current === item.href || current.startsWith(`${item.href}/`)),
    [nav, current],
  );

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      <header className="sticky top-0 z-30 border-b border-slate-100 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
          <a href="/" className="flex items-center gap-2.5 text-accent">
            <span className="grid size-9 place-items-center rounded-xl bg-accent text-white">
              <Icon name="qr" size={20} />
            </span>
            <span className="hidden text-sm font-semibold tracking-wide text-ink sm:block">
              Absensi
            </span>
          </a>

          <nav className="ml-2 hidden flex-1 items-center gap-1 lg:flex">
            {nav.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  item.href === active?.href
                    ? "bg-accent-soft text-accent"
                    : "text-slate-500 hover:bg-slate-50 hover:text-ink"
                }`}
              >
                <Icon name={item.icon} size={18} />
                {item.label}
              </a>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <div className="hidden text-right leading-tight lg:block">
              <div className="text-sm font-semibold">{user.nama}</div>
              <div className="text-xs uppercase tracking-wide text-slate-500">{user.role}</div>
            </div>
            <a
              href="/akun/password"
              className="hidden size-9 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-50 hover:text-ink lg:grid"
              title="Ubah kata sandi"
            >
              <Icon name="password" size={18} />
            </a>
            <form action="/logout" method="post" className="hidden lg:block">
              <button
                type="submit"
                className="grid size-9 place-items-center rounded-lg text-slate-500 transition hover:bg-red-50 hover:text-bad"
                title="Keluar"
              >
                <Icon name="logout" size={18} />
              </button>
            </form>

            {/* Avatar + menu (mobile) */}
            <a
              href="/akun/password"
              className="grid size-9 place-items-center rounded-full bg-accent-soft text-xs font-bold text-accent lg:hidden"
              aria-label={`Profil ${user.nama}`}
            >
              {initials(user.nama)}
            </a>
            <div className="lg:hidden">
              <MobileHeaderMenu nav={nav} current={current} user={user} />
            </div>
          </div>
        </div>

        {menuOpen && (
          <nav className="grid gap-1 border-t border-slate-100 px-4 py-3 lg:hidden">
            {nav.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
                  item.href === active?.href
                    ? "bg-accent-soft text-accent"
                    : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                <Icon name={item.icon} size={18} />
                {item.label}
              </a>
            ))}
          </nav>
        )}
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-32 pt-5 sm:px-6 sm:py-6 lg:pb-8">
        {!hideTitle && (
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              {eyebrow && (
                <p className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
                  <span className="h-px w-5 bg-accent" aria-hidden="true" />
                  {eyebrow}
                </p>
              )}
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
              {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
            </div>
            {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
          </div>
        )}
        {children}
      </main>

      <MobileBottomNav user={user} current={current} />
    </div>
  );
}
