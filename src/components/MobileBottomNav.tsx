"use client";

import { useMemo, type ComponentType, type SVGProps } from "react";
import { Home, QrCode, User } from "lucide-react";

type Props = {
  user: { nama: string; role: "admin" | "guru" };
  current: string;
};

type LucideIcon = ComponentType<SVGProps<SVGSVGElement> & { size?: number }>;

type BottomItem = { href: string; label: string; icon: LucideIcon };

type Menu = { home: BottomItem; profile: BottomItem };

/**
 * Hanya tiga tujuan yang tersisa di bar bawah: beranda, pindai QR (tombol
 * mengambang di tengah), dan profil. Menu lain (rekap, data siswa, kartu)
 * dipindahkan ke beranda masing-masing role serta ke menu header mobile.
 */
const MENU: Record<"admin" | "guru", Menu> = {
  admin: {
    home: { href: "/admin", label: "Home", icon: Home },
    profile: { href: "/akun/password", label: "Profile", icon: User },
  },
  guru: {
    home: { href: "/guru/kelas", label: "Home", icon: Home },
    profile: { href: "/akun/password", label: "Profile", icon: User },
  },
};

const SCAN: BottomItem = { href: "/guru/scan", label: "Scan QR", icon: QrCode };

/**
 * Navigasi bawah mobile: bar pil mengambang dengan tiga tombol, tombol pindai
 * QR terangkat di tengah supaya paling mudah dijangkau ibu jari.
 */
export function MobileBottomNav({ user, current }: Props) {
  const menu = useMemo(() => MENU[user.role], [user.role]);

  const isActive = (href: string) => current === href || current.startsWith(`${href}/`);

  const renderItem = (item: BottomItem) => {
    const active = isActive(item.href);
    const ItemIcon = item.icon;
    return (
      <a
        key={item.href}
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={`flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-full py-1.5 transition ${
          active ? "text-accent" : "text-slate-500 hover:text-slate-700"
        }`}
      >
        <span
          className={`grid h-8 min-w-12 place-items-center rounded-full px-3 transition ${
            active ? "bg-accent-soft" : "bg-transparent"
          }`}
        >
          <ItemIcon size={20} strokeWidth={active ? 2.4 : 2} />
        </span>
        <span
          className={`text-[10px] leading-tight ${active ? "font-semibold" : "font-medium"}`}
        >
          {item.label}
        </span>
      </a>
    );
  };

  const scanActive = isActive(SCAN.href);

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 pb-[env(safe-area-inset-bottom)] lg:hidden"
      aria-label="Navigasi utama"
    >
      <div className="relative mx-auto mb-3 w-full max-w-md px-4">
        <div
          className="pointer-events-none absolute inset-x-0 -top-6 bottom-0 bg-gradient-to-t from-[#faf9f7] via-[#faf9f7]/85 to-transparent"
          aria-hidden="true"
        />
        <div className="relative rounded-full bg-slate-200 shadow-xl shadow-slate-900/15 ring-1 ring-slate-300/70">
          <div className="grid h-16 grid-cols-3 items-center">
            {renderItem(menu.home)}
            <div aria-hidden="true" />
            {renderItem(menu.profile)}
          </div>

          <a
            href={SCAN.href}
            aria-label="Scan QR"
            aria-current={scanActive ? "page" : undefined}
            className="absolute left-1/2 top-0 flex -translate-x-1/2 -translate-y-[32%] flex-col items-center transition active:scale-95"
          >
            <span
              className={`grid size-14 place-items-center rounded-full bg-white text-accent ring-[4px] ring-slate-200 transition ${
                scanActive
                  ? "shadow-lg shadow-accent/40"
                  : "shadow-md shadow-slate-900/25"
              }`}
            >
              <QrCode size={26} strokeWidth={scanActive ? 2.4 : 2} />
            </span>
            <span className="mt-0.5 rounded-full bg-slate-200 px-1.5 text-[10px] font-bold leading-[1.4] text-ink">
              {SCAN.label}
            </span>
          </a>
        </div>
      </div>
    </nav>
  );
}
