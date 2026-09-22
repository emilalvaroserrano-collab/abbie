import { formatDistanceToNowStrict, parseISO, isValid } from "date-fns";

export function relTime(iso: string) {
  if (!iso) return "";
  const d = parseISO(iso);
  if (!isValid(d)) return "";
  return formatDistanceToNowStrict(d, { addSuffix: true });
}

export function absTime(iso: string) {
  if (!iso) return "";
  const d = parseISO(iso);
  if (!isValid(d)) return iso;
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function compact(n: number) {
  if (n < 1000) return String(n);
  if (n < 1_000_000) return `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1)}k`;
  return `${(n / 1_000_000).toFixed(1)}m`;
}

export function statusTone(status: string): "live" | "warn" | "danger" | "muted" {
  const s = status.toUpperCase().replace(/[\s-]+/g, "_");
  if (/REJECT|FAIL|DENIED|ERROR|INVALID/.test(s) || s === "RED") return "danger";
  if (/PENDING|UNKNOWN|DISCONNECT|NOT_VERIFIED|NEED_MORE|EXPIRED/.test(s)) return "warn";
  if (/CONNECT|APPROV|GREEN|VERIFIED|LIVE|VALID|GRANTED/.test(s)) return "live";
  return "muted";
}

