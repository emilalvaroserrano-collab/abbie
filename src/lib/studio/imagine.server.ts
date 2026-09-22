import { randomUUID } from "node:crypto";

const QUALITY_MODELS = [
  "grok-imagine-image-quality",
  "grok-imagine-image-2.0",
  "grok-imagine-image",
];
const FAST_MODELS = ["grok-imagine-image-2.0", "grok-imagine-image"];
const VIDEO_MODEL = "grok-imagine-video-1.5";

export type CreativeKind = "banner" | "post" | "ad" | "video";

export type ImagineResult =
  | { ok: true; url: string; kind: "image" | "video"; prompt: string }
  | { ok: false; message: string; requestId?: string; prompt?: string };

export type StudioJob = {
  id: string;
  kind: string;
  prompt: string;
  requestId: string | null;
  mediaUrl: string | null;
  status: "pending" | "done" | "failed";
  error: string | null;
};

function apiKey() {
  return process.env.XAI_API_KEY ?? "";
}

export function aspectFor(kind: CreativeKind) {
  switch (kind) {
    case "banner":
      return "16:9";
    case "ad":
      return "1:1";
    case "video":
      return "16:9";
    default:
      return "1:1";
  }
}

type BusinessBrief = {
  label: string;
  videoScene: string;
  stillScene: string;
};

const BUSINESS_TYPES: Array<{ keys: string[] } & BusinessBrief> = [
  {
    keys: [
      "software",
      "information technology",
      "computers",
      "computer",
      "internet",
      "it company",
      "it services",
      "tech",
      "technology",
      "developer",
      "programming",
      "app development",
      "web design",
      "saas",
    ],
    label: "software and IT",
    videoScene:
      "a real software studio: engineers at dual monitors writing code, a product walkthrough on a laptop, a short standup at a whiteboard, cable-neat desks, warm office light",
    stillScene: "engineers collaborating at dual monitors in a modern software studio",
  },
  {
    keys: ["restaurant", "cafe", "coffee", "bakery", "food", "catering", "bar ", "grill"],
    label: "food and hospitality",
    videoScene:
      "a working kitchen and dining room: chef plating, steam, a pass of dishes, guests sitting down to eat, close-up of the signature dish",
    stillScene: "chef plating a signature dish in a busy kitchen",
  },
  {
    keys: ["salon", "barber", "spa", "beauty", "hair"],
    label: "salon and beauty",
    videoScene:
      "a busy salon floor: scissors and comb, a wash basin, a finished cut in the mirror, warm lighting, real clients",
    stillScene: "stylist finishing a cut in a sunlit salon mirror",
  },
  {
    keys: ["dental", "dentist", "clinic", "hospital", "medical", "doctor", "health"],
    label: "clinic and care",
    videoScene:
      "a calm clinic: receptionist greeting a patient, a clean treatment room, a clinician at work with care, no gore, no needles in close-up",
    stillScene: "welcoming clinic reception and a clinician speaking with a patient",
  },
  {
    keys: ["construction", "contractor", "builder", "architect", "engineering firm"],
    label: "construction",
    videoScene:
      "an active jobsite: workers in safety gear, a concrete pour or framing, a wide shot of the build, golden hour on scaffolding",
    stillScene: "construction crew in safety gear on an active site",
  },
  {
    keys: ["real estate", "property", "realtor", "housing"],
    label: "real estate",
    videoScene:
      "a property walkthrough: front door opening, living room with natural light, a balcony or garden, a family looking around",
    stillScene: "sunlit living room of a listed home, front door just opened",
  },
  {
    keys: ["auto", "car ", "motor", "garage", "mechanic", "dealership"],
    label: "automotive",
    videoScene:
      "a working garage or lot: a hood open, a mechanic at the engine, a freshly detailed car rolling out, chrome and concrete",
    stillScene: "mechanic at an open hood in a clean garage",
  },
  {
    keys: ["school", "tutor", "education", "training", "academy", "learning"],
    label: "education",
    videoScene:
      "a live classroom or workshop: instructor at a whiteboard, students working, a close shot of notes, daylight through windows",
    stillScene: "instructor and students working around a table in a bright classroom",
  },
  {
    keys: ["retail", "shop", "store", "boutique", "apparel", "fashion"],
    label: "retail",
    videoScene:
      "a real shop floor: racks and displays, a customer trying something, a bag handed over the counter, street window at dusk",
    stillScene: "boutique interior with product on display and a customer at the counter",
  },
  {
    keys: ["hotel", "resort", "inn", "lodging"],
    label: "hotel",
    videoScene:
      "arrival and stay: lobby doors, a made-up room, pool or garden, a welcome drink at the desk",
    stillScene: "sunlit hotel lobby and a freshly made room",
  },
  {
    keys: ["gym", "fitness", "yoga", "crossfit"],
    label: "fitness",
    videoScene:
      "a training floor: barbells, a coach cueing form, a class in motion, sweat and daylight",
    stillScene: "coach and athlete mid-set on a gym floor",
  },
  {
    keys: ["farm", "agriculture", "produce"],
    label: "farming",
    videoScene:
      "fields at work: harvest hands, crates of produce, a truck loading, early morning light",
    stillScene: "harvest hands packing fresh produce into crates",
  },
  {
    keys: ["logistics", "shipping", "delivery", "courier", "warehouse"],
    label: "logistics",
    videoScene:
      "a warehouse and last-mile run: scanning parcels, a van pulling out, a drop at a door",
    stillScene: "warehouse team scanning parcels beside a loading van",
  },
  {
    keys: ["legal", "law", "attorney", "accounting", "consult"],
    label: "professional services",
    videoScene:
      "a sharp office: a meeting at a wood table, documents reviewed, a handshake at the glass door",
    stillScene: "advisors in a meeting at a wood conference table",
  },
];

export function inferBusiness(input: {
  pageName?: string;
  category?: string;
  about?: string;
  theme?: string;
}): BusinessBrief {
  const hay = [input.pageName, input.category, input.about, input.theme]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  for (const t of BUSINESS_TYPES) {
    if (t.keys.some((k) => hay.includes(k))) {
      return { label: t.label, videoScene: t.videoScene, stillScene: t.stillScene };
    }
  }
  const cat = (input.category || "").replace(/^page$/i, "").trim();
  const about = (input.about || "").trim();
  const label = cat || "local business";
  const extra = about ? ` They do: ${about.slice(0, 180)}.` : "";
  return {
    label,
    videoScene: `people doing the real daily work of a ${label} — tools of the trade, clients or customers, the service being delivered.${extra}`,
    stillScene: `photoreal working scene of a ${label}${about ? `, ${about.slice(0, 120)}` : ""}`,
  };
}

export function buildCreativePrompt(input: {
  kind: CreativeKind;
  theme: string;
  pageName?: string;
  category?: string;
  about?: string;
}) {
  const brand = input.pageName?.trim() || "the business";
  const brief = inferBusiness(input);
  const theme = input.theme.trim();
  const themeBit =
    theme && !/premium|showcase|brand|inviting/i.test(theme) ? ` Extra beat: ${theme}.` : "";
  const aboutBit = input.about?.trim() ? ` About them: ${input.about.trim().slice(0, 180)}.` : "";

  if (input.kind === "video") {
    return [
      `Fast cinematic 6-second commercial of ${brand}, a ${brief.label} business.`,
      `Show only this work: ${brief.videoScene}.${themeBit}${aboutBit}`,
      "Photoreal people and places, one smooth camera move, rich natural light.",
      "Do not film a generic lifestyle montage, luxury cars, or an unrelated industry.",
      "No text overlays, no letters, no logos, no watermarks.",
    ].join(" ");
  }

  const frame =
    input.kind === "banner"
      ? "Wide 16:9 advertising still"
      : input.kind === "ad"
        ? "Square 1:1 paid social still"
        : "Feed-ready social photograph";
  return [
    `${frame} of ${brand} as a ${brief.label} business.`,
    `Subject: ${brief.stillScene}.${themeBit}${aboutBit}`,
    "Cinematic lighting, photoreal, premium commercial photography.",
    "Show the actual work of this business, not a generic brand mood.",
    "No text, no letters, no logos, no watermarks.",
  ].join(" ");
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function generateImage(input: {
  prompt: string;
  aspect?: string;
  fast?: boolean;
}): Promise<ImagineResult> {
  const key = apiKey();
  if (!key) return { ok: false, message: "Image generation is unavailable right now." };
  const prompt = input.prompt.trim().slice(0, 1200);
  if (!prompt) return { ok: false, message: "Describe the image first." };

  const models = input.fast ? FAST_MODELS : QUALITY_MODELS;
  let last = "Could not generate the image.";
  for (const model of models) {
    try {
      const res = await fetch("https://api.x.ai/v1/images/generations", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          prompt,
          n: 1,
          aspect_ratio: input.aspect ?? "16:9",
          resolution: "1k",
          response_format: "url",
        }),
      });
      const json = (await res.json()) as {
        data?: Array<{ url?: string }>;
        error?: { message?: string };
      };
      const url = json.data?.[0]?.url;
      if (res.ok && url) return { ok: true, url, kind: "image", prompt };
      last = json.error?.message || `Image failed (${res.status}).`;
    } catch (err) {
      last = err instanceof Error ? err.message : last;
    }
  }
  return { ok: false, message: last };
}

export async function startVideo(input: {
  prompt: string;
  aspect?: string;
  duration?: number;
  imageUrl?: string;
}): Promise<{ ok: true; requestId: string; prompt: string } | { ok: false; message: string }> {
  const key = apiKey();
  if (!key) return { ok: false, message: "Video generation is unavailable right now." };
  const prompt = input.prompt.trim().slice(0, 1200);
  if (!prompt) return { ok: false, message: "Describe the video first." };

  const body: Record<string, unknown> = {
    model: VIDEO_MODEL,
    prompt,
    duration: Math.min(Math.max(input.duration ?? 6, 4), 8),
    aspect_ratio: input.aspect ?? "16:9",
    resolution: "720p",
  };
  if (input.imageUrl) body.image = { url: input.imageUrl };

  try {
    const start = await fetch("https://api.x.ai/v1/videos/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const started = (await start.json()) as {
      request_id?: string;
      error?: { message?: string };
    };
    if (!start.ok || !started.request_id) {
      return {
        ok: false,
        message: started.error?.message || `Video failed to start (${start.status}).`,
      };
    }
    return { ok: true, requestId: started.request_id, prompt };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "Video failed." };
  }
}

export async function pollVideo(requestId: string): Promise<{
  status: "pending" | "done" | "failed";
  url?: string;
  message?: string;
}> {
  const key = apiKey();
  if (!key) return { status: "failed", message: "Video generation is unavailable right now." };
  try {
    const poll = await fetch(`https://api.x.ai/v1/videos/${requestId}`, {
      headers: { Authorization: `Bearer ${key}` },
    });
    const data = (await poll.json()) as {
      status?: string;
      video?: { url?: string };
      error?: { message?: string };
    };
    if (data.status === "done" && data.video?.url) {
      return { status: "done", url: data.video.url };
    }
    if (data.status === "failed" || data.status === "expired") {
      return { status: "failed", message: data.error?.message || `Video ${data.status}.` };
    }
    return { status: "pending" };
  } catch (err) {
    return {
      status: "pending",
      message: err instanceof Error ? err.message : undefined,
    };
  }
}

export async function waitForVideo(
  requestId: string,
  waitMs = 16_000,
): Promise<ImagineResult> {
  const deadline = Date.now() + waitMs;
  while (Date.now() < deadline) {
    await sleep(3000);
    const data = await pollVideo(requestId);
    if (data.status === "done" && data.url) {
      return { ok: true, url: data.url, kind: "video", prompt: "" };
    }
    if (data.status === "failed") {
      return { ok: false, message: data.message || "Video failed.", requestId };
    }
  }
  return { ok: false, message: "still-rendering", requestId };
}

export async function generateVideo(input: {
  prompt: string;
  aspect?: string;
  duration?: number;
  imageUrl?: string;
  waitMs?: number;
}): Promise<ImagineResult> {
  const started = await startVideo(input);
  if (!started.ok) return started;
  const waited = await waitForVideo(started.requestId, input.waitMs ?? 16_000);
  if (waited.ok) return { ...waited, prompt: started.prompt };
  return { ...waited, prompt: started.prompt, requestId: started.requestId };
}

export async function generateCreative(input: {
  kind: CreativeKind;
  theme: string;
  pageName?: string;
  category?: string;
  about?: string;
  fast?: boolean;
}): Promise<ImagineResult> {
  const prompt = buildCreativePrompt(input);
  const aspect = aspectFor(input.kind);
  if (input.kind === "video") {
    return generateVideo({ prompt, aspect, duration: 6, waitMs: 16_000 });
  }
  return generateImage({ prompt, aspect, fast: input.fast });
}

type JobRow = {
  id: string;
  kind: string;
  prompt: string;
  request_id: string | null;
  media_url: string | null;
  status: string;
  error: string | null;
};

function mapJob(r: JobRow): StudioJob {
  const status =
    r.status === "done" || r.status === "failed" ? r.status : "pending";
  return {
    id: r.id,
    kind: r.kind,
    prompt: r.prompt,
    requestId: r.request_id,
    mediaUrl: r.media_url,
    status,
    error: r.error,
  };
}

export async function rememberVideoJob(input: { requestId: string; prompt: string }) {
  const sql = await (await import("@/lib/db")).getSql();
  const id = randomUUID();
  await sql`
    insert into studio_jobs (id, kind, prompt, request_id, media_url, status, error)
    values (${id}, ${"video"}, ${input.prompt}, ${input.requestId}, ${null}, ${"pending"}, ${null})
  `;
  return {
    id,
    kind: "video",
    prompt: input.prompt,
    requestId: input.requestId,
    mediaUrl: null,
    status: "pending" as const,
    error: null,
  };
}

export async function completeJob(id: string, mediaUrl: string) {
  const sql = await (await import("@/lib/db")).getSql();
  await sql`
    update studio_jobs
    set status = ${"done"}, media_url = ${mediaUrl}, error = ${null}
    where id = ${id}
  `;
}

export async function failJob(id: string, error: string) {
  const sql = await (await import("@/lib/db")).getSql();
  await sql`
    update studio_jobs set status = ${"failed"}, error = ${error} where id = ${id}
  `;
}

export async function refreshJob(id: string): Promise<StudioJob | null> {
  const sql = await (await import("@/lib/db")).getSql();
  const rows = await sql<JobRow>`
    select id, kind, prompt, request_id, media_url, status, error
    from studio_jobs where id = ${id} limit 1
  `;
  const row = rows[0];
  if (!row) return null;
  const job = mapJob(row);
  if (job.status !== "pending" || !job.requestId) return job;
  const polled = await pollVideo(job.requestId);
  if (polled.status === "done" && polled.url) {
    await completeJob(job.id, polled.url);
    return { ...job, status: "done", mediaUrl: polled.url, error: null };
  }
  if (polled.status === "failed") {
    const message = polled.message || "Video failed.";
    await failJob(job.id, message);
    return { ...job, status: "failed", error: message };
  }
  return job;
}
