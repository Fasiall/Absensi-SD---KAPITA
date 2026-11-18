import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Russo_One, Sekuya } from "next/font/google";
import { ServiceWorkerRegistrar } from "@/components/ServiceWorkerRegistrar";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

const russo = Russo_One({
  variable: "--font-russo",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const sekuya = Sekuya({
  variable: "--font-sekuya",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const schoolName = process.env.SCHOOL_NAME || "SD KAPITA";

// Semua halaman butuh cookie sesi / kueri Prisma, jadi tidak boleh diprerender.
// Tanpa ini Next 16 memunculkan peringatan "runtime data during prerendering".
export const instant = false;

export const metadata: Metadata = {
  title: {
    default: `Absensi ${schoolName}`,
    template: `%s · Absensi ${schoolName}`,
  },
  description: `Aplikasi absensi QR Code ${schoolName}.`,
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    title: `Absensi ${schoolName}`,
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="id"
      className={`${jakarta.variable} ${russo.variable} ${sekuya.variable} h-full`}
    >
      <body className="min-h-full">
        {children}
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
