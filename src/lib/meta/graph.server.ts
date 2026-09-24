import {
  GRAPH_BASE,
  META_APP_TOKEN,
  META_SYSTEM_TOKEN,
  META_USER_TOKEN,
} from "./tokens.server";
import type {
  AccountsData,
  ActionResult,
  AdAccount,
  AdCampaign,
  ChatMessage,
  ConversationDetail,
  DashboardData,
  IgAccount,
  OperatorSnapshot,
  PageSummary,
  PostSummary,
  PublishResult,
  ThreadPreview,
  TokenHealth,
} from "./types";

type GraphErrorBody = {
  error?: { message?: string; code?: number; error_user_msg?: string };
};

class GraphError extends Error {
  code?: number;
  constructor(message: string, code?: number) {
    super(message);
    this.name = "GraphError";
    this.code = code;
  }
}

type PageInternal = PageSummary & { accessToken: string };

type CacheEntry<T> = { at: number; value: T };
const mem = new Map<string, CacheEntry<unknown>>();
const PAGES_TTL = 120_000;
const DASH_TTL = 120_000;
const TOKEN_TTL = 300_000;

async function cached<T>(key: string, ttl: number, fn: () => Promise<T>): Promise<T> {
  const hit = mem.get(key) as CacheEntry<T> | undefined;
  if (hit && Date.now() - hit.at < ttl) return hit.value;
  try {
    const value = await fn();
    mem.set(key, { at: Date.now(), value });
    return value;
  } catch (err) {
    if (hit) return hit.value;
    throw err;
  }
}

function qs(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === "") continue;
    search.set(k, String(v));
  }
  return search.toString();
}

async function graphFetch<T>(
  path: string,
  token: string,
  init?: { method?: "GET" | "POST"; body?: Record<string, unknown> },
): Promise<T> {
  const method = init?.method ?? "GET";
  const url = new URL(`${GRAPH_BASE}${path.startsWith("/") ? path : `/${path}`}`);
  url.searchParams.set("access_token", token);

  const res = await fetch(url, {
    method,
    headers:
      method === "POST"
        ? { "Content-Type": "application/json" }
        : undefined,
    body: method === "POST" ? JSON.stringify(init?.body ?? {}) : undefined,
  });

  const json = (await res.json()) as T & GraphErrorBody;
  if (!res.ok || json.error) {
    const raw =
      json.error?.error_user_msg ||
      json.error?.message ||
      `Graph request failed (${res.status})`;
    const msg =
      json.error?.code === 4 || /request limit/i.test(raw)
        ? "Meta is briefly rate-limiting this app. Wait a moment, then refresh."
        : raw;
    throw new GraphError(msg, json.error?.code);
  }
  return json;
}

type GraphList<T> = { data?: T[] };

async function graphList<T>(
  path: string,
  token: string,
  params: Record<string, string | number | undefined> = {},
): Promise<T[]> {
  const query = qs(params);
  const suffix = query ? `?${query}` : "";
  const json = await graphFetch<GraphList<T>>(`${path}${suffix}`, token);
  return json.data ?? [];
}

function pictureUrl(raw: unknown): string | null {
  if (!raw || typeof raw !== "object") return null;
  const data = (raw as { data?: { url?: string } }).data;
  return data?.url ?? null;
}

async function debugToken(input: string): Promise<TokenHealth> {
  return cached(`debug:${input.slice(-12)}`, TOKEN_TTL, async () => {
    try {
      const json = await graphFetch<{
        data?: {
          is_valid?: boolean;
          type?: string;
          expires_at?: number;
          scopes?: string[];
          application?: string;
        };
      }>(`/debug_token?${qs({ input_token: input })}`, META_APP_TOKEN);
      const d = json.data ?? {};
      return {
        label: d.application ?? "Meta",
        valid: Boolean(d.is_valid),
        type: d.type ?? "unknown",
        expiresAt: d.expires_at ?? 0,
        scopes: d.scopes ?? [],
      };
    } catch {
      return {
        label: "Meta",
        valid: false,
        type: "unknown",
        expiresAt: 0,
        scopes: [],
      };
    }
  });
}

async function loadMe() {
  return cached("me", TOKEN_TTL, () =>
    graphFetch<{ id: string; name?: string }>(
      `/me?${qs({ fields: "id,name" })}`,
      META_USER_TOKEN,
    ),
  );
}

async function loadPages(): Promise<{ pages: PageInternal[]; instagram: IgAccount[] }> {
  return cached("pages", PAGES_TTL, async () => {
    type RawPage = {
      id: string;
      name?: string;
      category?: string;
      category_list?: Array<{ name?: string }>;
      fan_count?: number;
      followers_count?: number;
      about?: string;
      description?: string;
      username?: string;
      access_token?: string;
      picture?: unknown;
      instagram_business_account?: {
        id: string;
        username?: string;
        name?: string;
        followers_count?: number;
        media_count?: number;
        profile_picture_url?: string;
      };
    };

    const raw = await graphList<RawPage>("/me/accounts", META_SYSTEM_TOKEN, {
      fields:
        "id,name,category,category_list,fan_count,followers_count,about,description,username,picture{url},instagram_business_account{id,username,name,followers_count,media_count,profile_picture_url},access_token",
      limit: 50,
    });

    const pages: PageInternal[] = raw.map((p) => {
      const cats = [
        p.category,
        ...(p.category_list ?? []).map((c) => c.name),
      ].filter((x): x is string => Boolean(x && x.trim()));
      const about = [p.about, p.description]
        .filter((x): x is string => Boolean(x && x.trim()))
        .join(" — ")
        .slice(0, 400);
      return {
        id: p.id,
        name: p.name ?? "Untitled page",
        category: [...new Set(cats)].join(", ") || "Page",
        fanCount: p.fan_count ?? 0,
        followersCount: p.followers_count ?? 0,
        about,
        pictureUrl: pictureUrl(p.picture),
        username: p.username ?? null,
        instagramId: p.instagram_business_account?.id ?? null,
        accessToken: p.access_token ?? META_SYSTEM_TOKEN,
      };
    });

    const instagram: IgAccount[] = [];
    for (const p of raw) {
      const ig = p.instagram_business_account;
      if (!ig) continue;
      instagram.push({
        id: ig.id,
        username: ig.username ?? "",
        name: ig.name ?? ig.username ?? "Instagram",
        followersCount: ig.followers_count ?? 0,
        mediaCount: ig.media_count ?? 0,
        pictureUrl: ig.profile_picture_url ?? null,
      });
    }

    return { pages, instagram };
  });
}

export type ManagedPage = PageInternal;

export async function getManagedPages(): Promise<PageInternal[]> {
  const { pages } = await loadPages();
  return pages;
}

function publicPage(p: PageInternal): PageSummary {
  const { accessToken: _drop, ...rest } = p;
  return rest;
}

async function loadConversations(pages: PageInternal[]): Promise<ThreadPreview[]> {
  const groups = await Promise.all(
    pages.map(async (page) => {
      try {
        type RawConv = {
          id: string;
          updated_time?: string;
          snippet?: string;
          message_count?: number;
          unread_count?: number;
          can_reply?: boolean;
          participants?: {
            data?: Array<{ id: string; name?: string }>;
          };
        };
        const convs = await graphList<RawConv>(
          `/${page.id}/conversations`,
          page.accessToken,
          {
            fields:
              "id,updated_time,snippet,message_count,unread_count,can_reply,participants",
            limit: 20,
          },
        );
        return convs.map((c) => {
          const others = (c.participants?.data ?? []).filter(
            (part) => part.id !== page.id,
          );
          const other = others[0];
          return {
            id: c.id,
            pageId: page.id,
            pageName: page.name,
            channel: "messenger" as const,
            name: other?.name ?? "Facebook user",
            participantId: other?.id ?? "",
            snippet: c.snippet ?? "",
            updatedAt: c.updated_time ?? "",
            messageCount: c.message_count ?? 0,
            unreadCount: c.unread_count ?? 0,
            canReply: Boolean(c.can_reply),
          };
        });
      } catch {
        return [] as ThreadPreview[];
      }
    }),
  );
  return groups
    .flat()
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

async function loadPosts(pages: PageInternal[], limit = 8): Promise<PostSummary[]> {
  const groups = await Promise.all(
    pages.map(async (page) => {
      try {
        type RawPost = {
          id: string;
          message?: string;
          created_time?: string;
          permalink_url?: string;
          full_picture?: string;
          shares?: { count?: number };
          likes?: { summary?: { total_count?: number } };
          comments?: { summary?: { total_count?: number } };
        };
        const posts = await graphList<RawPost>(
          `/${page.id}/posts`,
          page.accessToken,
          {
            fields:
              "id,message,created_time,permalink_url,full_picture,shares,likes.summary(true),comments.summary(true)",
            limit,
          },
        );
        return posts.map((post) => ({
          id: post.id,
          pageId: page.id,
          pageName: page.name,
          message: (post.message ?? "").trim(),
          createdAt: post.created_time ?? "",
          permalink: post.permalink_url ?? null,
          picture: post.full_picture ?? null,
          likes: post.likes?.summary?.total_count ?? 0,
          comments: post.comments?.summary?.total_count ?? 0,
          shares: post.shares?.count ?? 0,
        }));
      } catch {
        return [] as PostSummary[];
      }
    }),
  );
  return groups
    .flat()
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function fetchDashboard(): Promise<DashboardData> {
  return cached("dashboard", DASH_TTL, async () => {
    const [systemHealth, userHealth, me, bundle] = await Promise.all([
      debugToken(META_SYSTEM_TOKEN),
      debugToken(META_USER_TOKEN),
      loadMe(),
      loadPages(),
    ]);

    const [threads, posts] = await Promise.all([
      loadConversations(bundle.pages),
      loadPosts(bundle.pages, 6),
    ]);

    return {
      operator: { id: me.id, name: me.name ?? "Connected operator" },
      tokenHealth: { system: systemHealth, user: userHealth },
      pages: bundle.pages.map(publicPage),
      instagram: bundle.instagram,
      inbox: {
        unread: threads.reduce((n, t) => n + t.unreadCount, 0),
        recent: threads.slice(0, 8),
      },
      recentPosts: posts.slice(0, 8),
      fetchedAt: new Date().toISOString(),
    };
  });
}

export async function fetchInbox(): Promise<ThreadPreview[]> {
  const { pages } = await loadPages();
  return loadConversations(pages);
}

export async function fetchConversation(input: {
  pageId: string;
  conversationId: string;
}): Promise<ConversationDetail> {
  const { pages } = await loadPages();
  const page = pages.find((p) => p.id === input.pageId);
  if (!page) throw new GraphError("Page not found");

  type Raw = {
    id: string;
    can_reply?: boolean;
    participants?: { data?: Array<{ id: string; name?: string }> };
    messages?: {
      data?: Array<{
        id: string;
        message?: string;
        created_time?: string;
        from?: { id: string; name?: string };
        attachments?: {
          data?: Array<{
            mime_type?: string;
            image_data?: { url?: string; preview_url?: string };
            file_url?: string;
          }>;
        };
      }>;
    };
  };

  const raw = await graphFetch<Raw>(
    `/${input.conversationId}?${qs({
      fields:
        "id,can_reply,participants,messages.limit(40){id,message,from,created_time,attachments}",
    })}`,
    page.accessToken,
  );

  const others = (raw.participants?.data ?? []).filter((p) => p.id !== page.id);
  const other = others[0];
  const messages: ChatMessage[] = (raw.messages?.data ?? [])
    .map((m) => {
      const att = m.attachments?.data?.[0];
      const isImage = Boolean(att?.image_data?.url || att?.mime_type?.startsWith("image/"));
      return {
        id: m.id,
        text: m.message ?? "",
        fromId: m.from?.id ?? "",
        fromName: m.from?.name ?? "",
        createdAt: m.created_time ?? "",
        isPage: m.from?.id === page.id,
        attachmentUrl: att?.image_data?.url ?? att?.image_data?.preview_url ?? att?.file_url ?? null,
        attachmentKind: (att ? (isImage ? "image" : "file") : null) as ChatMessage["attachmentKind"],
      };
    })
    .sort((a, b) => (a.createdAt > b.createdAt ? 1 : -1));

  return {
    id: raw.id,
    pageId: page.id,
    pageName: page.name,
    name: other?.name ?? "Facebook user",
    participantId: other?.id ?? "",
    canReply: raw.can_reply !== false,
    messages,
  };
}

export async function replyConversation(input: {
  pageId: string;
  recipientId: string;
  text: string;
}): Promise<ActionResult> {
  const { pages } = await loadPages();
  const page = pages.find((p) => p.id === input.pageId);
  if (!page) return { ok: false, message: "Page not found" };
  const text = input.text.trim();
  if (!text) return { ok: false, message: "Message is empty" };
  if (!input.recipientId) return { ok: false, message: "Missing recipient" };

  try {
    const res = await graphFetch<{ message_id?: string }>(`/${page.id}/messages`, page.accessToken, {
      method: "POST",
      body: {
        recipient: { id: input.recipientId },
        messaging_type: "RESPONSE",
        message: { text },
      },
    });
    return { ok: true, id: res.message_id, message: "Sent on Messenger" };
  } catch (err) {
    const raw = err instanceof Error ? err.message : "Could not send message";
    const closed = /outside of allowed window/i.test(raw);
    if (closed) {
      try {
        const res = await graphFetch<{ message_id?: string }>(`/${page.id}/messages`, page.accessToken, {
          method: "POST",
          body: {
            recipient: { id: input.recipientId },
            messaging_type: "MESSAGE_TAG",
            tag: "HUMAN_AGENT",
            message: { text },
          },
        });
        return { ok: true, id: res.message_id, message: "Sent on Messenger" };
      } catch (tagErr) {
        const tagRaw = tagErr instanceof Error ? tagErr.message : raw;
        if (/outside of allowed window/i.test(tagRaw)) {
          return {
            ok: false,
            message:
              "Messenger won’t deliver this. They last wrote too long ago, so Meta closed the chat. Add their WhatsApp number and send again.",
            extra: { reason: "window" },
          };
        }
        return { ok: false, message: tagRaw };
      }
    }
    return { ok: false, message: raw };
  }
}

export async function fetchPosts(): Promise<PostSummary[]> {
  const { pages } = await loadPages();
  return loadPosts(pages, 12);
}

export async function publishToPages(input: {
  pageIds: string[];
  message: string;
  link?: string;
}): Promise<PublishResult> {
  const { pages } = await loadPages();
  const message = input.message.trim();
  if (!message) {
    return {
      results: [
        { pageId: "", pageName: "", ok: false, message: "Write something first" },
      ],
    };
  }
  const targets = pages.filter((p) => input.pageIds.includes(p.id));
  if (targets.length === 0) {
    return {
      results: [{ pageId: "", pageName: "", ok: false, message: "Pick a page" }],
    };
  }

  const results = await Promise.all(
    targets.map(async (page) => {
      try {
        const body: Record<string, unknown> = { message };
        if (input.link?.trim()) body.link = input.link.trim();
        const res = await graphFetch<{ id?: string }>(`/${page.id}/feed`, page.accessToken, {
          method: "POST",
          body,
        });
        return {
          pageId: page.id,
          pageName: page.name,
          ok: true,
          id: res.id,
          message: "Published",
        };
      } catch (err) {
        return {
          pageId: page.id,
          pageName: page.name,
          ok: false,
          message: err instanceof Error ? err.message : "Publish failed",
        };
      }
    }),
  );
  return { results };
}

export async function publishMedia(input: {
  pageId: string;
  message: string;
  mediaUrl: string;
  mediaKind: "image" | "video";
  scheduledUnix?: number;
}): Promise<ActionResult> {
  const { pages } = await loadPages();
  const page = pages.find((p) => p.id === input.pageId);
  if (!page) return { ok: false, message: "Page not found" };
  const caption = input.message.trim();
  const mediaUrl = input.mediaUrl.trim();
  if (!mediaUrl) return { ok: false, message: "Missing creative URL" };

  const fields: Record<string, string> = {};
  if (input.scheduledUnix && input.scheduledUnix > Math.floor(Date.now() / 1000) + 600) {
    fields.published = "false";
    fields.scheduled_publish_time = String(input.scheduledUnix);
  }

  try {
    if (input.mediaKind === "video") {
      const res = await graphForm<{ id?: string }>(`/${page.id}/videos`, page.accessToken, {
        file_url: mediaUrl,
        description: caption,
        ...fields,
      });
      return {
        ok: true,
        id: res.id,
        message: fields.scheduled_publish_time ? "Video scheduled" : "Video published",
      };
    }
    const res = await graphForm<{ id?: string; post_id?: string }>(
      `/${page.id}/photos`,
      page.accessToken,
      {
        url: mediaUrl,
        caption,
        ...fields,
      },
    );
    return {
      ok: true,
      id: res.post_id ?? res.id,
      message: fields.scheduled_publish_time ? "Photo scheduled" : "Photo published",
    };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : "Could not publish media",
    };
  }
}

export async function fetchAccounts(): Promise<AccountsData> {
  const [systemHealth, userHealth, me, bundle, businesses] =
    await Promise.all([
      debugToken(META_SYSTEM_TOKEN),
      debugToken(META_USER_TOKEN),
      loadMe(),
      loadPages(),
      cached("businesses", TOKEN_TTL, () =>
        graphList<{ id: string; name?: string }>("/me/businesses", META_USER_TOKEN, {
          fields: "id,name",
        }).catch(() => [] as Array<{ id: string; name?: string }>),
      ),
    ]);

  return {
    operator: { id: me.id, name: me.name ?? "Connected operator" },
    tokenHealth: { system: systemHealth, user: userHealth },
    pages: bundle.pages.map(publicPage),
    instagram: bundle.instagram,
    businesses: businesses.map((b) => ({ id: b.id, name: b.name ?? "Business" })),
  };
}

async function graphForm<T>(
  path: string,
  token: string,
  fields: Record<string, string>,
): Promise<T> {
  const url = `${GRAPH_BASE}${path.startsWith("/") ? path : `/${path}`}`;
  const body = new URLSearchParams();
  for (const [k, v] of Object.entries(fields)) {
    if (v === undefined || v === "") continue;
    body.set(k, v);
  }
  body.set("access_token", token);
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const json = (await res.json()) as T & GraphErrorBody;
  if (!res.ok || json.error) {
    const raw =
      json.error?.error_user_msg ||
      json.error?.message ||
      `Graph request failed (${res.status})`;
    const msg =
      json.error?.code === 4 || /request limit/i.test(raw)
        ? "Meta is briefly rate-limiting this app. Wait a moment, then refresh."
        : raw;
    throw new GraphError(msg, json.error?.code);
  }
  return json;
}

export async function fetchAdAccounts(): Promise<AdAccount[]> {
  return cached("adaccounts", 180_000, async () => {
    const raw = await graphList<{
      id: string;
      name?: string;
      account_status?: number;
      currency?: string;
      amount_spent?: string;
      business_name?: string;
    }>("/me/adaccounts", META_USER_TOKEN, {
      fields: "id,name,account_status,currency,amount_spent,business_name",
      limit: 25,
    });
    return raw.map((a) => ({
      id: a.id,
      name: a.name ?? a.id,
      status: a.account_status ?? 0,
      currency: a.currency ?? "",
      spent: a.amount_spent ?? "0",
      businessName: a.business_name ?? null,
    }));
  });
}

export async function fetchCampaigns(accountId: string, limit = 8): Promise<AdCampaign[]> {
  const id = accountId.startsWith("act_") ? accountId : `act_${accountId}`;
  const raw = await graphList<{
    id: string;
    name?: string;
    objective?: string;
    status?: string;
    created_time?: string;
  }>(`/${id}/campaigns`, META_USER_TOKEN, {
    fields: "id,name,objective,status,created_time",
    limit,
  });
  return raw.map((c) => ({
    id: c.id,
    accountId: id,
    name: c.name ?? "Untitled campaign",
    objective: c.objective ?? "",
    status: c.status ?? "",
    createdAt: c.created_time ?? "",
  }));
}

function normalizeObjective(raw: string): string {
  const s = raw.trim().toUpperCase().replace(/[\s-]+/g, "_");
  const map: Record<string, string> = {
    AWARENESS: "OUTCOME_AWARENESS",
    BRAND_AWARENESS: "OUTCOME_AWARENESS",
    REACH: "OUTCOME_AWARENESS",
    TRAFFIC: "OUTCOME_TRAFFIC",
    LINK_CLICKS: "OUTCOME_TRAFFIC",
    ENGAGEMENT: "OUTCOME_ENGAGEMENT",
    MESSAGES: "OUTCOME_ENGAGEMENT",
    POST_ENGAGEMENT: "OUTCOME_ENGAGEMENT",
    LEADS: "OUTCOME_LEADS",
    LEAD_GENERATION: "OUTCOME_LEADS",
    SALES: "OUTCOME_SALES",
    CONVERSIONS: "OUTCOME_SALES",
    PURCHASE: "OUTCOME_SALES",
    APP: "OUTCOME_APP_PROMOTION",
    APP_PROMOTION: "OUTCOME_APP_PROMOTION",
    APP_INSTALLS: "OUTCOME_APP_PROMOTION",
  };
  if (s.startsWith("OUTCOME_")) return s;
  return map[s] ?? "OUTCOME_TRAFFIC";
}

function optimizationFor(objective: string): string {
  switch (objective) {
    case "OUTCOME_AWARENESS":
      return "REACH";
    case "OUTCOME_ENGAGEMENT":
      return "CONVERSATIONS";
    case "OUTCOME_LEADS":
      return "LEAD_GENERATION";
    case "OUTCOME_SALES":
      return "OFFSITE_CONVERSIONS";
    case "OUTCOME_APP_PROMOTION":
      return "APP_INSTALLS";
    default:
      return "LINK_CLICKS";
  }
}

export async function createCampaign(input: {
  accountId?: string;
  name: string;
  objective: string;
  dailyBudget?: number;
}): Promise<ActionResult> {
  const accounts = await fetchAdAccounts();
  const wanted = (input.accountId ?? "").replace(/^act_/, "").toLowerCase();
  const account =
    accounts.find(
      (a) =>
        a.id.replace(/^act_/, "").toLowerCase() === wanted ||
        a.name.toLowerCase() === wanted ||
        a.id.toLowerCase() === `act_${wanted}`,
    ) ?? accounts[0];
  if (!account) return { ok: false, message: "No ad account is connected." };

  const name = input.name.trim();
  if (!name) return { ok: false, message: "Campaign needs a name." };
  const objective = normalizeObjective(input.objective || "OUTCOME_TRAFFIC");
  const act = account.id.startsWith("act_") ? account.id : `act_${account.id}`;

  try {
    const created = await graphForm<{ id?: string }>(`/${act}/campaigns`, META_USER_TOKEN, {
      name,
      objective,
      status: "PAUSED",
      special_ad_categories: "[]",
    });
    if (!created.id) return { ok: false, message: "Meta did not return a campaign id." };

    const extra: Record<string, string> = {
      accountId: act,
      accountName: account.name,
      currency: account.currency,
      objective,
    };

    if (input.dailyBudget && input.dailyBudget > 0) {
      const minor = Math.round(input.dailyBudget * 100);
      try {
        const set = await graphForm<{ id?: string }>(`/${act}/adsets`, META_USER_TOKEN, {
          name: `${name} — ad set`,
          campaign_id: created.id,
          daily_budget: String(minor),
          billing_event: "IMPRESSIONS",
          optimization_goal: optimizationFor(objective),
          targeting: JSON.stringify({ geo_locations: { countries: ["PH"] } }),
          status: "PAUSED",
        });
        if (set.id) extra.adSetId = set.id;
        extra.dailyBudget = `${input.dailyBudget} ${account.currency}/day`;
      } catch (err) {
        extra.adSetNote =
          err instanceof Error
            ? `Campaign created; ad set skipped (${err.message})`
            : "Campaign created; ad set skipped.";
      }
    }

    return {
      ok: true,
      id: created.id,
      extra,
      message: `Paused campaign “${name}” is live in Ads Manager.`,
    };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : "Could not create the campaign.",
    };
  }
}

const EMPTY_SNAPSHOT = (): OperatorSnapshot => ({
  operator: "Connected operator",
  pages: [],
  instagram: [],
  adAccounts: [],
  inboxUnread: 0,
  whatsappLink: {
    status: "idle",
    userName: null,
    userPhone: null,
    error: null,
    saved: false,
  },
});

let snapshotInflight: Promise<OperatorSnapshot> | null = null;

function isThinSnapshot(s: OperatorSnapshot) {
  return s.pages.length === 0 && s.adAccounts.length === 0;
}

export async function fetchOperatorSnapshot(): Promise<OperatorSnapshot> {
  if (snapshotInflight) return snapshotInflight;
  const run = (async () => {
    const hit = mem.get("operator-snapshot") as CacheEntry<OperatorSnapshot> | undefined;
    const ttl = hit && isThinSnapshot(hit.value) ? 20_000 : 180_000;
    if (hit && Date.now() - hit.at < ttl) return hit.value;

    const snap = EMPTY_SNAPSHOT();
    try {
      const me = await loadMe();
      snap.operator = me.name ?? snap.operator;
    } catch {
      /* keep default */
    }
    try {
      const bundle = await loadPages();
      snap.pages = bundle.pages.map((p) => ({
        id: p.id,
        name: p.name,
        fans: p.fanCount,
        category: p.category,
        about: p.about,
      }));
      snap.instagram = bundle.instagram.map((ig) => ({
        id: ig.id,
        username: ig.username,
        followers: ig.followersCount,
      }));
    } catch {
      /* keep empty pages */
    }
    try {
      snap.adAccounts = await fetchAdAccounts();
    } catch {
      /* keep empty ads */
    }
    mem.set("operator-snapshot", { at: Date.now(), value: snap });
    return snap;
  })().finally(() => {
    snapshotInflight = null;
  });
  snapshotInflight = run;
  const data = await run;
  try {
    const wa = await import("@/lib/whatsapp/baileys.server");
    wa.ensureStarted();
    data.whatsappLink = wa.getLinkSummary();
  } catch {
    /* WhatsApp link is optional */
  }
  return data;
}


