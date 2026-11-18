import "server-only";

import QRCode from "qrcode";

/** Setara qr_png_data_uri() di utils.py: QR PNG sebagai data URI. */
export async function qrPngDataUri(text: string): Promise<string> {
  return QRCode.toDataURL(text, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 320,
    color: { dark: "#111827", light: "#FFFFFF" },
  });
}

/** QR sebagai buffer PNG untuk PDF / cetak. */
export async function qrPngBuffer(text: string, width = 320): Promise<Buffer> {
  return QRCode.toBuffer(text, {
    errorCorrectionLevel: "M",
    margin: 2,
    width,
    color: { dark: "#111827", light: "#FFFFFF" },
  });
}
