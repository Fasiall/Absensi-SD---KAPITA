import type { SessionUser } from "@/lib/auth";
import type { NavItem } from "@/components/AppShell";

export function navFor(user: SessionUser): NavItem[] {
  const home: NavItem = { href: user.role === "admin" ? "/admin" : "/guru/scan", label: "Beranda", icon: "dashboard" };

  if (user.role === "admin") {
    return [
      home,
      { href: "/admin/siswa", label: "Siswa", icon: "students" },
      { href: "/admin/kelas", label: "Kelas", icon: "classes" },
      { href: "/admin/guru", label: "Guru", icon: "teachers" },
      { href: "/admin/import", label: "Impor", icon: "import" },
      { href: "/admin/rekap", label: "Rekap", icon: "reports" },
      { href: "/cetak", label: "Kartu", icon: "cards" },
    ];
  }

  return [
    { href: "/guru/scan", label: "Scan", icon: "scan" },
    { href: "/guru/kelas", label: "Kelas Saya", icon: "classes" },
    { href: "/admin/kelas", label: "Data Kelas", icon: "classes" },
    { href: "/guru/rekap", label: "Rekap", icon: "reports" },
    { href: "/cetak", label: "Kartu", icon: "cards" },
  ];
}
