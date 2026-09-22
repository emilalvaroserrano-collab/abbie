import { Mic, MicOff, PhoneOff } from "lucide-react";
import { AbbieAvatar } from "@/components/marks";
import { cn } from "@/lib/utils";

export type CallPhase = "connecting" | "listening" | "thinking" | "speaking";

const PHASE_LABEL: Record<CallPhase, string> = {
  connecting: "Calling…",
  listening: "Listening",
  thinking: "Abbie’s thinking",
  speaking: "Speaking",
};

export function CallOverlay({
  open,
  phase,
  caption,
  muted,
  onHangup,
  onToggleMute,
}: {
  open: boolean;
  phase: CallPhase;
  caption: string;
  muted: boolean;
  onHangup: () => void;
  onToggleMute: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-bg text-fg">
      <div className="flex flex-1 flex-col items-center justify-center px-6">
        <div className="relative mb-8 grid place-items-center">
          {(phase === "listening" || phase === "speaking") && (
            <>
              <span className="call-ring absolute size-36 rounded-full border border-accent/40" />
              <span className="call-ring absolute size-36 rounded-full border border-accent/30" />
              <span className="call-ring absolute size-36 rounded-full border border-accent/20" />
            </>
          )}
          <AbbieAvatar size={112} />
        </div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Abbie</h1>
        <p className="mt-1.5 text-sm text-muted">{PHASE_LABEL[phase]}</p>
        {phase === "listening" && !muted && (
          <div className="mt-5 flex h-7 items-end gap-1" aria-hidden>
            {[0, 1, 2, 3, 4].map((i) => (
              <span
                key={i}
                className="wave-bar w-1 rounded-full bg-accent"
                style={{ height: `${10 + ((i * 7) % 18)}px` }}
              />
            ))}
          </div>
        )}
        <p
          className={cn(
            "mt-8 min-h-16 max-w-sm text-center text-base leading-relaxed text-fg",
            !caption && "text-faint",
          )}
        >
          {caption || (muted ? "Mic is muted" : "Just say it.")}
        </p>
        <div className="mt-10 flex items-center justify-center gap-10">
          <button
            type="button"
            onClick={onToggleMute}
            className={cn(
              "flex size-14 flex-col items-center justify-center rounded-full transition-colors duration-150",
              muted ? "bg-accent text-accent-fg" : "bg-elevated text-fg",
            )}
            aria-label={muted ? "Unmute" : "Mute"}
          >
            {muted ? <MicOff className="size-6" /> : <Mic className="size-6" />}
          </button>
          <button
            type="button"
            onClick={onHangup}
            className="flex size-16 items-center justify-center rounded-full bg-danger text-accent-fg transition-transform duration-150 active:scale-[0.96]"
            aria-label="End call"
          >
            <PhoneOff className="size-7" />
          </button>
        </div>
      </div>
    </div>
  );
}
