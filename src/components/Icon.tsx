import type { SVGProps } from "react";

type Props = SVGProps<SVGSVGElement> & { name: IconName; size?: number };

export type IconName =
  | "qr"
  | "dashboard"
  | "students"
  | "classes"
  | "teachers"
  | "import"
  | "reports"
  | "cards"
  | "scan"
  | "logout"
  | "password"
  | "plus"
  | "search"
  | "edit"
  | "trash"
  | "download"
  | "eye"
  | "eye-off"
  | "user"
  | "lock"
  | "check"
  | "x"
  | "clock"
  | "camera"
  | "sync"
  | "info"
  | "chevron-left"
  | "chevron-right";

const paths: Record<IconName, string> = {
  qr: "M3 3h7v7H3V3Zm11 0h7v7h-7V3ZM3 14h7v7H3v-7Zm11 3h3v3h-3v-3Zm4-3h3v3h-3v-3Zm0-3h3v1h-3v-1Zm-4 3h1v3h-1v-3Z",
  dashboard: "M4 13h6V4H4v9Zm10 7h6v-9h-6v9ZM4 20h6v-4H4v4Zm10-13h6V4h-6v3Z",
  students: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 2c-4 0-8 2-8 4.5V21h16v-2.5c0-2.5-4-4.5-8-4.5Z",
  classes: "M4 6h16v2H4V6Zm0 5h16v2H4v-2Zm0 5h10v2H4v-2Z",
  teachers: "M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7 1a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM9 13c-3 0-6 1.6-6 3.5V19h12v-2.5C15 14.6 12 13 9 13Zm7 .5c-.8 0-1.5.1-2.2.3 1.4.9 2.2 2 2.2 3.2V19h5v-2c0-1.7-2.2-3.5-5-3.5Z",
  import: "M12 3v10m0 0 4-4m-4 4-4-4M4 17h16v3H4v-3Z",
  reports: "M5 3h9l5 5v13H5V3Zm8 1.5V9h4.5L13 4.5ZM8 13h8v1.5H8V13Zm0 4h5v1.5H8V17Z",
  cards: "M3 5h18v4H3V5Zm0 6h18v8H3v-8Zm3 2v4h6v-4H6Z",
  scan: "M3 7V4h3v2H5v1H3Zm18 0V6h-1V4h3v3h-2ZM3 17h2v1h1v2H3v-3Zm16 1v-1h2v3h-3v-2h1ZM7 8h4v4H7V8Zm6 0h4v4h-4V8Zm-6 6h4v4H7v-4Zm6 1h4v3h-4v-3Z",
  logout: "M10 4H5v16h5v-2H7V6h3V4Zm3.6 3.6L15.4 11H9v2h6.4l-1.8 3.4 1.7 1L19 12l-3.7-5.4-1.7 1Z",
  password: "M12 3a5 5 0 0 0-5 5v2H5v11h14V10h-2V8a5 5 0 0 0-5-5Zm0 2a3 3 0 0 1 3 3v2H9V8a3 3 0 0 1 3-3Zm0 9a2 2 0 0 1 1 3.7V20h-2v-2.3A2 2 0 0 1 12 14Z",
  plus: "M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6V5Z",
  search: "M10 3a7 7 0 1 0 4.2 12.6l4.1 4.1 1.4-1.4-4.1-4.1A7 7 0 0 0 10 3Zm0 2a5 5 0 1 1 0 10 5 5 0 0 1 0-10Z",
  edit: "M4 17.2V20h2.8L18 8.8 15.2 6 4 17.2ZM19.4 7.4 16.6 4.6 18 3.2 20.8 6l-1.4 1.4Z",
  trash: "M7 4h10l1 2h4v2H2V6h4l1-2Zm-3 6h16l-1.3 10H5.3L4 10Zm4 2 .4 6h1.5l-.4-6H8Zm5 0h-1.5l-.4 6H13l-.4-6h.4Z",
  download: "M12 3v10l3.5-3.5 1.4 1.4L12 17l-4.9-6.1 1.4-1.4L12 13V3ZM4 19h16v2H4v-2Z",
  eye: "M12 5c-5 0-9 4.5-9 7s4 7 9 7 9-4.5 9-7-4-7-9-7Zm0 11.5A4.5 4.5 0 1 1 12 7.5a4.5 4.5 0 0 1 0 9ZM12 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z",
  "eye-off": "M3.3 2 2 3.3l3 3C3.6 7.4 2.3 9 2 10.5c.9 3 4.7 6.5 10 6.5 1.8 0 3.4-.5 4.8-1.3l3 3 1.3-1.3L3.3 2Zm7 7 2.1 2.1A2 2 0 0 0 10.3 9ZM12 5c5.3 0 9.1 3.5 10 6.5-.4 1.4-1.4 2.8-2.8 4l-1.4-1.4c1-.8 1.7-1.7 2-2.6-.9-2.1-3.6-4.5-7.8-4.5-.9 0-1.7.1-2.5.4L8.1 5.9C9.3 5.3 10.6 5 12 5Z",
  user: "M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm0 10c-4.4 0-8 2.2-8 5v3h16v-3c0-2.8-3.6-5-8-5Z",
  lock: "M6 10V8a6 6 0 1 1 12 0v2h1v11H5V10h1Zm2 0h8V8a4 4 0 1 0-8 0v2Z",
  check: "M9.5 17.5 4 12l1.5-1.5 4 4L18.5 5.5 20 7l-10.5 10.5Z",
  x: "M6.4 5 12 10.6 17.6 5 19 6.4 13.4 12 19 17.6 17.6 19 12 13.4 6.4 19 5 17.6 10.6 12 5 6.4 6.4 5Z",
  clock: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 2a7 7 0 1 1 0 14 7 7 0 0 1 0-14Zm-1 2v6l5 3 1-1.7-4-2.3V7h-2Z",
  camera: "M9 3h6l1.5 2H21v14H3V5h4.5L9 3Zm3 4a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm0 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6Z",
  sync: "M12 5a7 7 0 0 1 6.3 4H16v2h6V5h-2v2.6A9 9 0 0 0 3.4 10l1.9.6A7 7 0 0 1 12 5Zm-6.3 6H8v-2H2v6h2v-2.6A9 9 0 0 0 20.6 14l-1.9-.6A7 7 0 0 1 5.7 11Z",
  info: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 2a7 7 0 1 1 0 14 7 7 0 0 1 0-14Zm-1 3h2v2h-2V8Zm0 4h2v5h-2v-5Z",
  "chevron-left": "M15 4.4 7.4 12l7.6 7.6L16.4 18l-6-6 6-6-1.4-1.6Z",
  "chevron-right": "M8.6 4.4 7.2 6l6 6-6 6 1.4 1.6L16.2 12 8.6 4.4Z",
};

export function Icon({ name, size = 20, ...rest }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      {...rest}
    >
      <path d={paths[name]} />
    </svg>
  );
}
