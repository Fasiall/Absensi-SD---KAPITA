"use client";

import { useMemo, type ReactNode } from "react";
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
  const active = useMemo(
    () => nav.find((item) => current === item.href || current.startsWith(`${item.href}/`)),
    [nav, current],
  );

  return (
    <div className="min-h-screen bg-canvas">
      <header className="sticky top-0 z-30 border-b border-line bg-surface">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
          <a href="/" className="flex min-w-0 items-center gap-2.5 text-accent">
            <span className="truncate text-sm font-semibold tracking-wide text-ink sm:text-base">
              SDN Purwodadi Simpang
            </span>
          </a>

          <nav className="ml-2 hidden flex-1 items-center gap-1 lg:flex">
            {nav.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 rounded-soft px-3 py-2 text-sm font-medium transition ${
                  item.href === active?.href
                    ? "bg-accent-soft text-accent"
                    : "text-muted hover:bg-canvas hover:text-ink"
                }`}
              >
                <Icon name={item.icon} size={18} />
                {item.label}
              </a>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <div className="hidden text-right leading-tight lg:block">
              <div className="text-sm font-semibold text-ink">{user.nama}</div>
              <div className="text-[11px] font-medium uppercase tracking-wide text-muted">
                {user.role}
              </div>
            </div>
            <a
              href="/akun/password"
              className="btn-icon hidden lg:grid"
              title="Ubah kata sandi"
            >
              <Icon name="password" size={18} />
            </a>
            <form action="/logout" method="post" className="hidden lg:block">
              <button
                type="submit"
                className="btn-icon hover:bg-bad-soft hover:text-bad"
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
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-32 pt-5 sm:px-6 sm:py-6 lg:pb-8">
        {!hideTitle && (
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
              {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
              <h1 className="page-title">{title}</h1>
              {subtitle && <p className="page-subtitle">{subtitle}</p>}
            </div>
            {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
          </div>
        )}
        {children}
      </main>

      <MobileBottomNav user={user} current={current} />
    </div>
  );
}
