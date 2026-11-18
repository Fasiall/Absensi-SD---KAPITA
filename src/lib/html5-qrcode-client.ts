"use client";

type Html5QrcodeCtor = new (
  elementId: string,
  config?: { verbose?: boolean },
) => {
  start: (
    camera: { facingMode: string },
    config: { fps: number; qrbox: { width: number; height: number } },
    onSuccess: (decodedText: string) => void,
    onError?: (message: string) => void,
  ) => Promise<void>;
  stop: () => Promise<void>;
  clear: () => void;
};

type Html5QrcodeWindow = Window & {
  Html5Qrcode?: Html5QrcodeCtor;
};

const SCRIPT_ID = "html5-qrcode-script";
const SRC = "/vendor/html5-qrcode.min.js";

function loadScript(): Promise<Html5QrcodeCtor> {
  const existing = (window as Html5QrcodeWindow).Html5Qrcode;
  if (existing) return Promise.resolve(existing);

  return new Promise((resolve, reject) => {
    const prior = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    const script = prior ?? document.createElement("script");

    script.addEventListener("load", () => {
      const ctor = (window as Html5QrcodeWindow).Html5Qrcode;
      if (ctor) resolve(ctor);
      else reject(new Error("Pustaka pemindai QR gagal dimuat."));
    });
    script.addEventListener("error", () => {
      reject(new Error("Pustaka pemindai QR gagal dimuat."));
    });

    if (!prior) {
      script.id = SCRIPT_ID;
      script.src = SRC;
      script.async = true;
      document.body.appendChild(script);
    }
  });
}

export type ScannerHandle = { stop: () => Promise<void>; clear: () => void };

export async function startScanner(
  elementId: string,
  onDecoded: (code: string) => void,
): Promise<ScannerHandle> {
  const Html5Qrcode = await loadScript();
  const scanner = new Html5Qrcode(elementId, { verbose: false });

  await scanner.start(
    { facingMode: "environment" },
    { fps: 10, qrbox: { width: 240, height: 240 } },
    (decodedText) => onDecoded(decodedText.trim()),
    () => undefined,
  );

  return {
    stop: () => scanner.stop(),
    clear: () => scanner.clear(),
  };
}
