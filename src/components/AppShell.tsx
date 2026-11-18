"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Icon, type IconName } from "@/components/Icon";

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
  children: ReactNode;
};

export function AppShell({ user, nav, current, title, subtitle, actions, children }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const active = useMemo(
    () => nav.find((item) => current === item.href || current.startsWith(`${item.href}/`)),
    [nav, current],
  );

  return (
    <div className="min-h-screen bg-canvas">
      <header className="sticky top-0 z-30 border-b border-line bg-surface/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
          <a href="/" className="flex items-center gap-2 text-accent">
            <span className="grid size-9 place-items-center rounded-xl bg-accent text-white">
              <Icon name="qr" size={20} />
            </span>
            <span className="hidden text-sm font-semibold tracking-wide text-ink sm:block">
              Absensi
            </span>
          </a>

          <nav className="ml-2 hidden flex-1 items-center gap-1 md:flex">
            {nav.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
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
            <div className="hidden text-right leading-tight sm:block">
              <div className="text-sm font-semibold">{user.nama}</div>
              <div className="text-xs uppercase tracking-wide text-muted">{user.role}</div>
            </div>
            <a
              href="/akun/password"
              className="grid size-9 place-items-center rounded-lg text-muted transition hover:bg-canvas hover:text-ink"
              title="Ubah kata sandi"
            >
              <Icon name="password" size={18} />
            </a>
            <form action="/logout" method="post">
              <button
                type="submit"
                className="grid size-9 place-items-center rounded-lg text-muted transition hover:bg-red-50 hover:text-bad"
                title="Keluar"
              >
                <Icon name="logout" size={18} />
              </button>
            </form>
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="grid size-9 place-items-center rounded-lg text-muted transition hover:bg-canvas md:hidden"
              aria-label="Menu"
            >
              <Icon name={menuOpen ? "x" : "classes"} size={20} />
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav className="grid gap-1 border-t border-line px-4 py-3 md:hidden">
            {nav.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
                  item.href === active?.href
                    ? "bg-accent-soft text-accent"
                    : "text-muted hover:bg-canvas"
                }`}
              >
                <Icon name={item.icon} size={18} />
                {item.label}
              </a>
            ))}
          </nav>
        )}
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
          </div>
          {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </div>
        {children}
      </main>
    </div>
  );
}
