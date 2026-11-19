import type { Flash } from "@/lib/flash";
import { Icon } from "@/components/Icon";

const tones: Record<Flash["tone"], { box: string; icon: "check" | "info" | "x" }> = {
  success: { box: "border-ok/25 bg-ok-soft text-ok", icon: "check" },
  danger: { box: "border-bad/25 bg-bad-soft text-bad", icon: "x" },
  warning: { box: "border-warn/25 bg-warn-soft text-warn", icon: "info" },
  info: { box: "border-accent/25 bg-accent-soft text-accent", icon: "info" },
};

export function FlashMessages({ messages }: { messages: Flash[] }) {
  if (!messages.length) return null;

  return (
    <div className="mb-4 grid gap-2">
      {messages.map((flash, index) => {
        const tone = tones[flash.tone];
        return (
          <div
            key={`${flash.tone}-${index}`}
            role="status"
            className={`flex items-start gap-2.5 rounded-soft border px-3 py-2.5 text-xs leading-relaxed ${tone.box}`}
          >
            <Icon name={tone.icon} className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="font-medium">{flash.message}</span>
          </div>
        );
      })}
    </div>
  );
}
