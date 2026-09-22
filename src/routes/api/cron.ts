import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/cron")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const studio = await import("@/lib/studio/schedule.server");
          const result = await studio.tickStudio();
          return Response.json({ ok: true, ...result });
        } catch (e) {
          return Response.json(
            { ok: false, error: e instanceof Error ? e.message : "tick failed" },
            { status: 500 },
          );
        }
      },
    },
  },
});
