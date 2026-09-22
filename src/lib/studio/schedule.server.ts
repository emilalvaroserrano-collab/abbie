import { randomUUID } from "node:crypto";
import { getSql } from "@/lib/db";
import { generateCreative, type CreativeKind } from "./imagine.server";

export type StudioCampaign = {
  id: string;
  pageId: string;
  pageName: string;
  theme: string;
  kind: string;
  timezone: string;
  hours: number[];
  active: boolean;
};

export type StudioSlot = {
  id: string;
  campaignId: string;
  publishAt: string;
  caption: string;
  mediaUrl: string | null;
  mediaKind: string;
  fbPostId: string | null;
  status: string;
  error: string | null;
};

type CampaignRow = {
  id: string;
  page_id: string;
  page_name: string;
  theme: string;
  kind: string;
  timezone: string;
  hours: string;
  active: boolean | number | string;
};

type SlotRow = {
  id: string;
  campaign_id: string;
  publish_at: string | Date;
  caption: string;
  media_url: string | null;
  media_kind: string;
  fb_post_id: string | null;
  status: string;
  error: string | null;
};

const DEFAULT_HOURS = [9, 13, 17, 21];
const DEFAULT_TZ = "Asia/Manila";

function asBool(v: boolean | number | string) {
  return v === true || v === 1 || v === "t" || v === "true";
}

function parseHours(raw: string) {
  const hours = raw
    .split(",")
    .map((x) => Number(x.trim()))
    .filter((n) => Number.isFinite(n) && n >= 0 && n <= 23);
  return hours.length ? hours : DEFAULT_HOURS;
}

function toIso(v: string | Date) {
  if (v instanceof Date) return v.toISOString();
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? String(v) : d.toISOString();
}

function mapCampaign(r: CampaignRow): StudioCampaign {
  return {
    id: r.id,
    pageId: r.page_id,
    pageName: r.page_name,
    theme: r.theme,
    kind: r.kind,
    timezone: r.timezone,
    hours: parseHours(r.hours),
    active: asBool(r.active),
  };
}

function mapSlot(r: SlotRow): StudioSlot {
  return {
    id: r.id,
    campaignId: r.campaign_id,
    publishAt: toIso(r.publish_at),
    caption: r.caption,
    mediaUrl: r.media_url,
    mediaKind: r.media_kind,
    fbPostId: r.fb_post_id,
    status: r.status,
    error: r.error,
  };
}

function partNum(parts: Intl.DateTimeFormatPart[], type: string) {
  return Number(parts.find((p) => p.type === type)?.value ?? "0");
}

function zonedTimeToUtc(
  tz: string,
  year: number,
  month: number,
  day: number,
  hour: number,
): Date {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  let t = Date.UTC(year, month - 1, day, hour, 0, 0);
  for (let i = 0; i < 4; i += 1) {
    const p = fmt.formatToParts(new Date(t));
    const got = Date.UTC(
      partNum(p, "year"),
      partNum(p, "month") - 1,
      partNum(p, "day"),
      partNum(p, "hour"),
      partNum(p, "minute"),
      partNum(p, "second"),
    );
    const want = Date.UTC(year, month - 1, day, hour, 0, 0);
    t += want - got;
  }
  return new Date(t);
}

function wallDate(tz: string, at: Date) {
  const p = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hourCycle: "h23",
  }).formatToParts(at);
  return {
    year: partNum(p, "year"),
    month: partNum(p, "month"),
    day: partNum(p, "day"),
  };
}

function addDays(year: number, month: number, day: number, extra: number) {
  const d = new Date(Date.UTC(year, month - 1, day + extra));
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

export function upcomingSlots(tz: string, hours: number[], count: number, from = new Date()) {
  const wall = wallDate(tz, from);
  const out: Date[] = [];
  const min = from.getTime() + 12 * 60 * 1000;
  for (let day = 0; day < 10 && out.length < count; day += 1) {
    const d = addDays(wall.year, wall.month, wall.day, day);
    for (const h of hours) {
      const at = zonedTimeToUtc(tz, d.year, d.month, d.day, h);
      if (at.getTime() > min) out.push(at);
      if (out.length >= count) break;
    }
  }
  return out;
}

export function formatInZone(iso: string, tz: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

async function writeCaptions(theme: string, pageName: string, n: number): Promise<string[]> {
  const apiKey = process.env.XAI_API_KEY;
  const fallback = Array.from({ length: n }, (_, i) => {
    const beats = [
      `Fresh from ${pageName}. ${theme}.`,
      `See what’s new at ${pageName}.`,
      `${pageName} — ${theme}.`,
      `Today at ${pageName}. Come through.`,
    ];
    return beats[i % beats.length]!;
  });
  if (!apiKey) return fallback;
  try {
    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "grok-4.5",
        temperature: 0.7,
        max_tokens: 280,
        messages: [
          {
            role: "system",
            content:
              "Write Facebook Page captions. Return ONLY a JSON array of strings. No markdown. 1-2 sentences each. No hashtag walls, no emoji.",
          },
          {
            role: "user",
            content: `${n} captions for page “${pageName}” about: ${theme}`,
          },
        ],
      }),
    });
    if (!res.ok) return fallback;
    const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const raw = json.choices?.[0]?.message?.content ?? "";
    const match = raw.match(/\[[\s\S]*\]/);
    const parsed = JSON.parse(match?.[0] ?? raw) as unknown;
    if (!Array.isArray(parsed)) return fallback;
    const lines = parsed.map((x) => String(x).trim()).filter(Boolean);
    return lines.length ? lines.slice(0, n) : fallback;
  } catch {
    return fallback;
  }
}

export async function listStudio() {
  const sql = await getSql();
  const campaigns = (
    await sql<CampaignRow>`
      select id, page_id, page_name, theme, kind, timezone, hours, active
      from studio_campaigns
      where active = true
      order by created_at desc
    `
  ).map(mapCampaign);
  const slots = (
    await sql<SlotRow>`
      select id, campaign_id, publish_at, caption, media_url, media_kind, fb_post_id, status, error
      from studio_slots
      where publish_at >= now() - interval '1 day'
      order by publish_at asc
      limit 32
    `
  ).map(mapSlot);
  return { campaigns, slots };
}

export async function pauseCampaign(id: string) {
  const sql = await getSql();
  await sql`update studio_campaigns set active = false where id = ${id}`;
  return { ok: true as const };
}

async function publishSlot(slot: StudioSlot, pageId: string) {
  const graph = await import("@/lib/meta/graph.server");
  const unix = Math.floor(new Date(slot.publishAt).getTime() / 1000);
  const now = Math.floor(Date.now() / 1000);
  const scheduled = unix > now + 600 ? unix : undefined;
  if (!slot.mediaUrl) {
    return graph.publishToPages({
      pageIds: [pageId],
      message: slot.caption,
    });
  }
  const result = await graph.publishMedia({
    pageId,
    message: slot.caption,
    mediaUrl: slot.mediaUrl,
    mediaKind: slot.mediaKind === "video" ? "video" : "image",
    scheduledUnix: scheduled,
  });
  return { results: [{ pageId, pageName: "", ...result }] };
}

async function attachMedia(campaign: StudioCampaign, slots: StudioSlot[]) {
  if (!slots.length) return slots;
  let category: string | undefined;
  let about: string | undefined;
  try {
    const { fetchOperatorSnapshot } = await import("@/lib/meta/graph.server");
    const snap = await fetchOperatorSnapshot();
    const page =
      snap.pages.find((p) => p.id === campaign.pageId) ??
      snap.pages.find((p) => p.name === campaign.pageName);
    category = page?.category;
    about = page?.about;
  } catch {
    /* infer from the page name */
  }
  const sql = await getSql();
  const creatives = await Promise.all(
    slots.map((slot, i) =>
      generateCreative({
        kind: ((campaign.kind as CreativeKind) === "video" ? "banner" : campaign.kind) as CreativeKind,
        theme: `${campaign.theme}. Variation ${i + 1}.`,
        pageName: campaign.pageName,
        category,
        about,
        fast: true,
      }),
    ),
  );
  const out: StudioSlot[] = [];
  for (let i = 0; i < slots.length; i += 1) {
    const slot: StudioSlot = { ...slots[i]! };
    const creative = creatives[i]!;
    if (creative.ok) {
      slot.mediaUrl = creative.url;
      slot.mediaKind = creative.kind;
      slot.error = null;
    } else {
      slot.error = creative.message;
    }
    await sql`
      update studio_slots
      set media_url = ${slot.mediaUrl}, media_kind = ${slot.mediaKind}, error = ${slot.error}
      where id = ${slot.id}
    `;
    if (!slot.mediaUrl) {
      out.push(slot);
      continue;
    }
    try {
      const published = await publishSlot(slot, campaign.pageId);
      const first = published.results[0];
      const unix = Math.floor(new Date(slot.publishAt).getTime() / 1000);
      if (first?.ok) {
        const status = unix > Math.floor(Date.now() / 1000) + 600 ? "scheduled" : "published";
        await sql`
          update studio_slots
          set status = ${status}, fb_post_id = ${first.id ?? null}, error = null
          where id = ${slot.id}
        `;
        slot.status = status;
        slot.fbPostId = first.id ?? null;
      } else {
        const err = first?.message ?? "Could not schedule on Facebook.";
        await sql`update studio_slots set error = ${err} where id = ${slot.id}`;
        slot.error = err;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Schedule failed.";
      await sql`update studio_slots set error = ${message} where id = ${slot.id}`;
      slot.error = message;
    }
    out.push(slot);
  }
  return out;
}

export async function fillCampaign(
  campaign: StudioCampaign,
  opts: { limit: number; includeVideo?: boolean },
) {
  const sql = await getSql();
  const needed = upcomingSlots(campaign.timezone, campaign.hours, 16);
  const existing = (
    await sql<SlotRow>`
      select id, campaign_id, publish_at, caption, media_url, media_kind, fb_post_id, status, error
      from studio_slots where campaign_id = ${campaign.id}
    `
  ).map(mapSlot);
  const haveIso = new Set(existing.map((r) => new Date(r.publishAt).toISOString()));
  const future = existing.filter((r) => new Date(r.publishAt).getTime() > Date.now());
  const created: StudioSlot[] = [];

  const naked = future
    .filter((s) => !s.mediaUrl && (s.status === "pending" || s.status === "rendering"))
    .slice(0, opts.limit);
  if (naked.length) {
    created.push(...(await attachMedia(campaign, naked)));
  }

  const want = Math.max(0, Math.min(opts.limit, 4 - future.length));
  const missing = needed.filter((d) => !haveIso.has(d.toISOString())).slice(0, want);
  if (!missing.length) return { created };

  const fallback = missing.map((_, i) => {
    const beats = [
      `Fresh from ${campaign.pageName}. ${campaign.theme}.`,
      `See what’s new at ${campaign.pageName}.`,
      `${campaign.pageName} — ${campaign.theme}.`,
      `Today at ${campaign.pageName}. Come through.`,
    ];
    return beats[i % beats.length]!;
  });
  const captions = await Promise.race([
    writeCaptions(campaign.theme, campaign.pageName, missing.length),
    new Promise<string[]>((r) => setTimeout(() => r(fallback), 6000)),
  ]);

  const slots: StudioSlot[] = missing.map((at, i) => ({
    id: randomUUID(),
    campaignId: campaign.id,
    publishAt: at.toISOString(),
    caption: captions[i] ?? fallback[i] ?? campaign.theme,
    mediaUrl: null,
    mediaKind: "image",
    fbPostId: null,
    status: "pending",
    error: null,
  }));
  for (const slot of slots) {
    await sql`
      insert into studio_slots (
        id, campaign_id, publish_at, caption, media_url, media_kind, fb_post_id, status, error
      ) values (
        ${slot.id}, ${slot.campaignId}, ${slot.publishAt}, ${slot.caption},
        ${slot.mediaUrl}, ${slot.mediaKind}, ${slot.fbPostId}, ${slot.status}, ${slot.error}
      )
    `;
  }
  created.push(...(await attachMedia(campaign, slots)));
  return { created };
}

export async function createDailyCampaign(input: {
  pageId: string;
  pageName: string;
  theme: string;
  kind?: CreativeKind;
  timezone?: string;
  includeVideo?: boolean;
}) {
  const sql = await getSql();
  const existing = (
    await sql<CampaignRow>`
      select id, page_id, page_name, theme, kind, timezone, hours, active
      from studio_campaigns
      where page_id = ${input.pageId} and active = true
      order by created_at desc
      limit 1
    `
  ).map(mapCampaign);
  const theme = input.theme.trim().slice(0, 400) || "the business";
  const kind = input.kind && input.kind !== "video" ? input.kind : "banner";

  let campaign = existing[0];
  if (campaign) {
    await sql`
      update studio_campaigns
      set theme = ${theme}, kind = ${kind}, page_name = ${input.pageName}
      where id = ${campaign.id}
    `;
    campaign = { ...campaign, theme, kind, pageName: input.pageName };
  } else {
    campaign = {
      id: randomUUID(),
      pageId: input.pageId,
      pageName: input.pageName,
      theme,
      kind,
      timezone: input.timezone || DEFAULT_TZ,
      hours: DEFAULT_HOURS,
      active: true,
    };
    await sql`
      insert into studio_campaigns (id, page_id, page_name, theme, kind, timezone, hours, active)
      values (
        ${campaign.id}, ${campaign.pageId}, ${campaign.pageName}, ${campaign.theme},
        ${campaign.kind}, ${campaign.timezone}, ${campaign.hours.join(",")}, true
      )
    `;
  }

  const filled = await fillCampaign(campaign, { limit: 4 });
  const listed = await listStudio();
  const slots = listed.slots.filter((s) => s.campaignId === campaign.id).slice(0, 8);
  return { campaign, slots: filled.created.length ? filled.created : slots };
}

export async function tickStudio() {
  const sql = await getSql();
  const campaigns = (
    await sql<CampaignRow>`
      select id, page_id, page_name, theme, kind, timezone, hours, active
      from studio_campaigns where active = true
    `
  ).map(mapCampaign);

  const filled: StudioSlot[] = [];
  for (const campaign of campaigns) {
    const more = await fillCampaign(campaign, { limit: 4 });
    filled.push(...more.created);
  }

  const due = (
    await sql<SlotRow>`
      select s.id, s.campaign_id, s.publish_at, s.caption, s.media_url, s.media_kind,
             s.fb_post_id, s.status, s.error
      from studio_slots s
      join studio_campaigns c on c.id = s.campaign_id
      where c.active = true
        and s.status = 'pending'
        and s.publish_at <= now() + interval '2 minutes'
      order by s.publish_at asc
      limit 4
    `
  ).map(mapSlot);

  const published: StudioSlot[] = [];
  for (const slot of due) {
    const campaign = campaigns.find((c) => c.id === slot.campaignId);
    if (!campaign) continue;
    try {
      const result = await publishSlot(slot, campaign.pageId);
      const first = result.results[0];
      if (first?.ok) {
        await sql`
          update studio_slots
          set status = 'published', fb_post_id = ${first.id ?? null}, error = null
          where id = ${slot.id}
        `;
        published.push({ ...slot, status: "published", fbPostId: first.id ?? null });
      } else {
        const err = first?.message ?? "Publish failed.";
        await sql`update studio_slots set error = ${err} where id = ${slot.id}`;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Publish failed.";
      await sql`update studio_slots set error = ${message} where id = ${slot.id}`;
    }
  }

  return { published: published.length, filled: filled.length, campaigns: campaigns.length };
}
