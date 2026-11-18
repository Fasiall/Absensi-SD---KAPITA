import type { Flash } from "@/lib/flash";

const tones: Record<Flash["tone"], string> = {
  success: "border-green-200 bg-green-50 text-ok",
  danger: "border-red-200 bg-red-50 text-bad",
  warning: "border-amber-200 bg-amber-50 text-warn",
  info: "border-blue-200 bg-accent-soft text-accent",
};

export function FlashMessages({ messages }: { messages: Flash[] }) {
  if (!messages.length) return null;

  return (
    <div className="mb-5 grid gap-2">
      {messages.map((flash, index) => (
        <div
          key={`${flash.tone}-${index}`}
          role="status"
          className={`rounded-xl border px-4 py-3 text-sm ${tones[flash.tone]}`}
        >
          {flash.message}
        </div>
      ))}
    </div>
  );
}
