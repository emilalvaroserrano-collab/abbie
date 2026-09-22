import { cn } from "@/lib/utils";

/** Original Abbie mark — custom “a”, not a Messenger lightning bubble. */
export function AbbieMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-8", className)} aria-hidden>
      <rect width="32" height="32" rx="9" fill="#14110F" />
      <circle cx="16" cy="16" r="11" fill="#C46A4A" />
      <path
        fill="#fff"
        d="M13.2 21.6c-2.6 0-4.4-1.8-4.4-4.7 0-2.9 1.9-4.8 4.6-4.8 1.6 0 2.8.6 3.6 1.7V9.4h2.4v12h-2.3l-.1-1.1c-.8 1-2 1.3-3.8 1.3Zm.4-2.1c1.6 0 2.7-1.2 2.7-2.8 0-1.6-1.1-2.7-2.7-2.7s-2.7 1.1-2.7 2.7c0 1.7 1.1 2.8 2.7 2.8Z"
      />
    </svg>
  );
}

/** Human portrait — copper disc, not a chat-app glyph. */
export function AbbieAvatar({ className, size = 40 }: { className?: string; size?: number }) {
  return (
    <span
      className={cn("relative inline-flex shrink-0 overflow-hidden rounded-full", className)}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 64 64" className="size-full" aria-hidden>
        <circle cx="32" cy="32" r="32" fill="#C46A4A" />
        <path d="M8 58c4-10 14-16 24-16s20 6 24 16v10H8V58Z" fill="#8F4632" />
        <path d="M22 48c2.5-6 7-9 10-9s7.5 3 10 9v12H22V48Z" fill="#D7A07A" />
        <ellipse cx="32" cy="28.5" rx="12" ry="14" fill="#E8B892" />
        <path
          d="M18 30c1-14 9-20 14-20 5.2 0 13 6.2 14 20 0 3.5-1.2 7-3 9-1.8-10-5.5-16-11-16s-9.2 6-11 16c-1.8-2-3-5.5-3-9Z"
          fill="#241610"
        />
        <path
          d="M20 22c3.5-5.5 8.5-8 12-7.4 2 .4 3.2 2.2 2.8 4.2-.5 2.4-2.6 3.2-4.8 2.2-2.6-1.2-6.8 0-9.2 2.6-1.4 1.5-2.8.6-2.4-1.6.2-1.2.8-2.4 1.6-4Z"
          fill="#1A110E"
        />
        <ellipse cx="27" cy="29.5" rx="1.5" ry="1.9" fill="#241610" />
        <ellipse cx="37" cy="29.5" rx="1.5" ry="1.9" fill="#241610" />
        <ellipse cx="27.4" cy="28.9" rx="0.45" ry="0.5" fill="#F3D7C0" />
        <ellipse cx="37.4" cy="28.9" rx="0.45" ry="0.5" fill="#F3D7C0" />
        <path
          d="M28 35.2c2.4 2.2 5.6 2.2 8 0"
          fill="none"
          stroke="#B56A4A"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        <circle cx="44.2" cy="33.5" r="1.9" fill="none" stroke="#E2B15A" strokeWidth="1.2" />
      </svg>
    </span>
  );
}

export const AriaMark = AbbieMark;
export const AriaAvatar = AbbieAvatar;
export const AtriumMark = AbbieMark;

export function FacebookMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("size-4", className)} aria-hidden>
      <path
        fill="currentColor"
        d="M14.2 8.2h2.3V5.1h-2.3c-2.6 0-4.3 1.6-4.3 4.3v1.7H8v3.1h1.9V21h3.3v-6.8h2.5l.5-3.1h-3V9.6c0-.9.4-1.4 1.5-1.4Z"
      />
    </svg>
  );
}

export function InstagramMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("size-4", className)} aria-hidden>
      <rect x="4.2" y="4.2" width="15.6" height="15.6" rx="4.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="3.6" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="16.6" cy="7.4" r="0.9" fill="currentColor" />
    </svg>
  );
}

export function WhatsAppMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("size-4", className)} aria-hidden>
      <path
        fill="currentColor"
        d="M12 3.6A8.4 8.4 0 0 0 4.5 16.1L3.6 20.4l4.4-.9A8.4 8.4 0 1 0 12 3.6Zm4.7 11.9c-.2.5-1.1 1-1.6 1.1-.4.1-.9.1-1.5-.1-.3-.1-.8-.3-1.4-.5-2.5-1.1-4.1-3.6-4.2-3.8-.2-.2-1.2-1.6-1.2-3.1 0-1.4.7-2.1 1-2.4.3-.3.7-.4 1-.4h.7c.2 0 .5 0 .7.6l.9 2.2c.1.2 0 .4-.1.6l-.4.5c-.1.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.7-.1l.5-.6c.2-.2.4-.2.6-.1l2.1.9c.3.1.4.2.5.4 0 .4-.2 1.3-.7 1.7Z"
      />
    </svg>
  );
}
