export function metaErrorMessage(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (/request limit/i.test(msg) || /\(#4\)/.test(msg)) {
    return "Meta is briefly rate-limiting this app. Wait a moment, then refresh — your accounts are still connected.";
  }
  return msg;
}

export async function settle<T>(
  fn: () => Promise<T>,
): Promise<{ data: T | null; error: string | null }> {
  try {
    return { data: await fn(), error: null };
  } catch (e) {
    return { data: null, error: metaErrorMessage(e) };
  }
}
