import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const getStudioSchedule = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const studio = await import("./schedule.server");
    return { data: await studio.listStudio(), error: null as string | null };
  } catch (e) {
    return {
      data: null,
      error: e instanceof Error ? e.message : "Could not load the schedule.",
    };
  }
});

export const tickStudioSchedule = createServerFn({ method: "POST" }).handler(async () => {
  try {
    const studio = await import("./schedule.server");
    return { data: await studio.tickStudio(), error: null as string | null };
  } catch (e) {
    return {
      data: null,
      error: e instanceof Error ? e.message : "Could not run the schedule.",
    };
  }
});

export const pauseStudioCampaign = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().min(8).max(80) }))
  .handler(async ({ data }) => {
    const studio = await import("./schedule.server");
    return studio.pauseCampaign(data.id);
  });

export const pollStudioJob = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().min(8).max(80) }))
  .handler(async ({ data }) => {
    try {
      const imagine = await import("./imagine.server");
      const job = await imagine.refreshJob(data.id);
      if (!job) {
        return { status: "failed" as const, mediaUrl: null, error: "That render expired.", mediaKind: "video" as const };
      }
      return {
        status: job.status,
        mediaUrl: job.mediaUrl,
        error: job.error,
        mediaKind: job.kind === "video" ? ("video" as const) : ("image" as const),
      };
    } catch (e) {
      return {
        status: "pending" as const,
        mediaUrl: null,
        error: e instanceof Error ? e.message : null,
        mediaKind: "video" as const,
      };
    }
  });
