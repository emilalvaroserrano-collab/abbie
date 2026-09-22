import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { metaErrorMessage } from "./safe";
import type { ActionResult, PublishResult } from "./types";

async function guard<T>(fn: () => Promise<T>): Promise<{ data: T | null; error: string | null }> {
  try {
    return { data: await fn(), error: null };
  } catch (e) {
    return { data: null, error: metaErrorMessage(e) };
  }
}

export const getDashboard = createServerFn({ method: "GET" }).handler(async () => {
  const { fetchDashboard } = await import("./graph.server");
  return guard(() => fetchDashboard());
});

export const getInbox = createServerFn({ method: "GET" }).handler(async () => {
  const { fetchInbox } = await import("./graph.server");
  return guard(() => fetchInbox());
});

export const getConversation = createServerFn({ method: "POST" })
  .validator(
    z.object({
      pageId: z.string().min(1),
      conversationId: z.string().min(1),
    }),
  )
  .handler(async ({ data }) => {
    const { fetchConversation } = await import("./graph.server");
    return guard(() => fetchConversation(data));
  });

export const sendReply = createServerFn({ method: "POST" })
  .validator(
    z.object({
      pageId: z.string().min(1),
      recipientId: z.string().min(1),
      text: z.string().min(1).max(2000),
    }),
  )
  .handler(async ({ data }): Promise<ActionResult> => {
    const { replyConversation } = await import("./graph.server");
    return replyConversation(data);
  });

export const getPosts = createServerFn({ method: "GET" }).handler(async () => {
  const { fetchPosts } = await import("./graph.server");
  return guard(() => fetchPosts());
});

export const publishPost = createServerFn({ method: "POST" })
  .validator(
    z.object({
      pageIds: z.array(z.string()).min(1),
      message: z.string().min(1).max(63206),
      link: z.string().optional(),
    }),
  )
  .handler(async ({ data }): Promise<PublishResult> => {
    const { publishToPages } = await import("./graph.server");
    return publishToPages(data);
  });

export const getAccounts = createServerFn({ method: "GET" }).handler(async () => {
  const { fetchAccounts } = await import("./graph.server");
  return guard(() => fetchAccounts());
});

export const getLeadBoard = createServerFn({ method: "POST" })
  .validator(
    z.object({
      query: z.string().max(120).optional(),
      pageId: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { fetchLeadBoard } = await import("./leads.server");
    return guard(() => fetchLeadBoard({ query: data.query, pageId: data.pageId, limit: 40 }));
  });
