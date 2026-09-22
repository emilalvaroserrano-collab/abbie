import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ErrorBanner({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex min-h-[50dvh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl bg-surface p-6 text-center shadow-[var(--shadow-border)]">
        <TriangleAlert className="mx-auto size-6 text-danger" />
        <h2 className="mt-3 font-display text-xl tracking-tight">Can’t reach Meta right now</h2>
        <p className="mt-2 text-sm text-muted">{message}</p>
        {onRetry ? (
          <Button variant="secondary" className="mt-5" onClick={onRetry}>
            Try again
          </Button>
        ) : null}
      </div>
    </div>
  );
}
