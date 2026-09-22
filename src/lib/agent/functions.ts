import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { AGENT_TOOLS, buildSystemPrompt, executeTool } from "./tools";
import type { AgentAction, AgentTurnResult, ChatTurn, MemoryUpdate } from "./types";

type OAIMessage = {
  role: string;
  content?: string | null;
  tool_calls?: Array<{
    id: string;
    type: "function";
    function: { name: string; arguments: string };
  }>;
  tool_call_id?: string;
  name?: string;
};

const turnInput = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      }),
    )
    .max(24),
  voice: z.boolean().optional(),
  memory: z
    .array(
      z.object({
        category: z.string().max(24),
        text: z.string().max(240),
      }),
    )
    .max(48)
    .optional(),
  otherTitles: z.array(z.string().max(80)).max(12).optional(),
});

async function synthesize(text: string, apiKey: string): Promise<string | null> {
  const spoken = text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[*_#`]+/g, "")
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 800);
  if (!spoken) return null;
  const res = await fetch("https://api.x.ai/v1/tts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: spoken,
      voice_id: "eve",
      language: "en",
    }),
  });
  if (!res.ok) return null;
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.byteLength < 80) return null;
  return buf.toString("base64");
}

async function completeTurn(
  messages: ChatTurn[],
  voice: boolean,
  memory: Array<{ category: string; text: string }>,
  otherTitles: string[],
): Promise<AgentTurnResult> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "Abbie’s voice is unavailable in this environment." };
  }

  const { fetchOperatorSnapshot } = await import("@/lib/meta/graph.server");
  const snapshot = await fetchOperatorSnapshot().catch(() => ({
    operator: "Connected operator",
    pages: [] as { id: string; name: string; fans: number; category: string; about: string }[],
    instagram: [] as { id: string; username: string; followers: number }[],
    adAccounts: [],
    inboxUnread: 0,
    whatsappLink: {
      status: "idle" as const,
      userName: null,
      userPhone: null,
      error: null,
      saved: false,
    },
  }));

  const convo: OAIMessage[] = [
    { role: "system", content: buildSystemPrompt(snapshot, voice, memory, otherTitles) },
    ...messages.map((m) => ({ role: m.role, content: m.content })),
  ];

  const actions: AgentAction[] = [];
  const memoryUpdates: MemoryUpdate[] = [];
  let guard = 0;
  while (guard++ < 5) {
    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "grok-4.5",
        messages: convo,
        tools: AGENT_TOOLS,
        tool_choice: "auto",
        temperature: voice ? 0.55 : 0.62,
        max_tokens: voice ? 360 : 720,
      }),
    });
    if (!res.ok) {
      const rate = res.status === 429;
      return {
        ok: false,
        error: rate
          ? "Give me a second — I’m catching my breath."
          : `Something’s off on my side (${res.status}). Try that again.`,
      };
    }
    const json = (await res.json()) as {
      choices?: Array<{
        message?: {
          content?: string | null;
          tool_calls?: OAIMessage["tool_calls"];
        };
        finish_reason?: string;
      }>;
    };
    const msg = json.choices?.[0]?.message;
    if (!msg) {
      return { ok: false, error: "I blanked for a second. Say that again?" };
    }
    const calls = msg.tool_calls ?? [];
    if (calls.length) {
      convo.push({
        role: "assistant",
        content: msg.content ?? null,
        tool_calls: calls,
      });
      for (const call of calls) {
        const result = await executeTool(
          call.function.name,
          call.function.arguments,
          snapshot,
          actions,
          memoryUpdates,
        );
        convo.push({
          role: "tool",
          tool_call_id: call.id,
          name: call.function.name,
          content: result,
        });
      }
      continue;
    }
    const text = (msg.content ?? "").trim();
    let audio: string | null = null;
    if (voice && text) {
      audio = await synthesize(text, apiKey);
    }
    return {
      ok: true,
      text: text || (actions.length ? "Done." : "I’m here."),
      actions,
      audio,
      memoryUpdates,
    };
  }
  return { ok: false, error: "I got tangled running that. Try a simpler ask." };
}

export const runAgentTurn = createServerFn({ method: "POST" })
  .validator(turnInput)
  .handler(async ({ data }): Promise<AgentTurnResult> => {
    const trimmed = data.messages
      .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }))
      .filter((m) => m.content.trim())
      .slice(-18);
    if (!trimmed.length || trimmed[trimmed.length - 1]?.role !== "user") {
      return { ok: false, error: "Say something first." };
    }
    try {
      return await completeTurn(
        trimmed,
        Boolean(data.voice),
        (data.memory ?? []).map((m) => ({ category: m.category, text: m.text })),
        data.otherTitles ?? [],
      );
    } catch (e) {
      return {
        ok: false,
        error: e instanceof Error ? e.message : "That didn’t land. Try again.",
      };
    }
  });

export const getSnapshot = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const { fetchOperatorSnapshot } = await import("@/lib/meta/graph.server");
    return { data: await fetchOperatorSnapshot(), error: null as string | null };
  } catch (e) {
    return {
      data: null,
      error: e instanceof Error ? e.message : "Could not load Meta accounts.",
    };
  }
});

let abbieGreeting: string | null | undefined;

export const speakGreeting = createServerFn({ method: "POST" }).handler(async () => {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) return { ok: false as const, error: "Voice is unavailable." };
  if (abbieGreeting) return { ok: true as const, audio: abbieGreeting };
  const audio = await synthesize(
    "Hey, it’s Abbie. Tell me what you need — WhatsApp, a page post, a banner, a paused ads campaign — and I’ll take it from there.",
    apiKey,
  );
  if (!audio) return { ok: false as const, error: "Could not start the call." };
  abbieGreeting = audio;
  return { ok: true as const, audio };
});

export const transcribeAudio = createServerFn({ method: "POST" })
  .validator(
    z.object({
      audioBase64: z.string().min(20).max(2_000_000),
      mime: z.string().max(80).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) return { ok: false as const, error: "Voice is unavailable." };
    const mime = data.mime && /^[\w.+-]+\/[\w.+-]+$/.test(data.mime) ? data.mime : "audio/webm";
    const bin = Buffer.from(data.audioBase64, "base64");
    if (bin.byteLength < 64) return { ok: false as const, error: "That clip was empty." };
    const form = new FormData();
    form.append(
      "file",
      new Blob([new Uint8Array(bin)], { type: mime }),
      "clip.webm",
    );
    form.append("model", "grok-voice-transcribe-2.0");
    form.append("language", "en");
    const res = await fetch("https://api.x.ai/v1/stt", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    });
    if (!res.ok) {
      return { ok: false as const, error: `Could not hear that (${res.status}).` };
    }
    const json = (await res.json()) as { text?: string };
    const text = (json.text ?? "").trim();
    if (!text) return { ok: false as const, error: "I didn’t catch that." };
    return { ok: true as const, text };
  });
