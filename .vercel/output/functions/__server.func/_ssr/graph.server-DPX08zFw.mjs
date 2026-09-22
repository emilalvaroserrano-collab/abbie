//#region node_modules/.nitro/vite/services/ssr/assets/graph.server-DPX08zFw.js
var GRAPH_BASE = `https://graph.facebook.com/v21.0`;
/** Never-expiring system user token — pages, publish, insights. */
var META_SYSTEM_TOKEN = "EAAQtdvBCMGcBShLQOaWX9nP7z7Bb2Xsgewm77lQvP0sy0WJHHinEKFT7DBPYj7SPzLmZCMacrz5t04w0a9cC8TJg8MRln0hA9hWDRdZAW9Qa1QO3ZCjooENAeCg2e0wIaXZARuaKpaVS8mzVddkCgwrriZCyEpmUjVIbXW9olWNGtr46VzZCYIBI6teaJptwZDZD";
/** User token — businesses, ad accounts, Instagram. */
var META_USER_TOKEN = "EAAQtdvBCMGcBSn51fEs6gYDRKSiZCErxjfNFok0kTdHrRH8eEOrAKfgvaFh3BLuUH60bXmDaLJ2tYChDYI3KF7G8NaAetKESz3QfhKCaMAhmSr1h3dLndeukczvshBWLGpilLbgAjA0M5AwSAkQFkjnzT2oIvzLt9Rtt9ge5IOZCzFGvmbi6ZB9lQg2136WfILuEAkpqEZC6CM9QN3uffPPsIDRCByIBVImZAMpyzDWMxfUOZCfgZDZD";
var GraphError = class extends Error {
	code;
	constructor(message, code) {
		super(message);
		this.name = "GraphError";
		this.code = code;
	}
};
var mem = /* @__PURE__ */ new Map();
var PAGES_TTL = 12e4;
var DASH_TTL = 12e4;
var TOKEN_TTL = 3e5;
async function cached(key, ttl, fn) {
	const hit = mem.get(key);
	if (hit && Date.now() - hit.at < ttl) return hit.value;
	try {
		const value = await fn();
		mem.set(key, {
			at: Date.now(),
			value
		});
		return value;
	} catch (err) {
		if (hit) return hit.value;
		throw err;
	}
}
function qs(params) {
	const search = new URLSearchParams();
	for (const [k, v] of Object.entries(params)) {
		if (v === void 0 || v === "") continue;
		search.set(k, String(v));
	}
	return search.toString();
}
async function graphFetch(path, token, init) {
	const method = init?.method ?? "GET";
	const url = new URL(`${GRAPH_BASE}${path.startsWith("/") ? path : `/${path}`}`);
	url.searchParams.set("access_token", token);
	const res = await fetch(url, {
		method,
		headers: method === "POST" ? { "Content-Type": "application/json" } : void 0,
		body: method === "POST" ? JSON.stringify(init?.body ?? {}) : void 0
	});
	const json = await res.json();
	if (!res.ok || json.error) {
		const raw = json.error?.error_user_msg || json.error?.message || `Graph request failed (${res.status})`;
		throw new GraphError(json.error?.code === 4 || /request limit/i.test(raw) ? "Meta is briefly rate-limiting this app. Wait a moment, then refresh." : raw, json.error?.code);
	}
	return json;
}
async function graphList(path, token, params = {}) {
	const query = qs(params);
	return (await graphFetch(`${path}${query ? `?${query}` : ""}`, token)).data ?? [];
}
function pictureUrl(raw) {
	if (!raw || typeof raw !== "object") return null;
	return raw.data?.url ?? null;
}
async function debugToken(input) {
	return cached(`debug:${input.slice(-12)}`, TOKEN_TTL, async () => {
		try {
			const d = (await graphFetch(`/debug_token?${qs({ input_token: input })}`, "1175888767103079|Xt8bfS90I7EetMsX3iuleIjzBuI")).data ?? {};
			return {
				label: d.application ?? "Meta",
				valid: Boolean(d.is_valid),
				type: d.type ?? "unknown",
				expiresAt: d.expires_at ?? 0,
				scopes: d.scopes ?? []
			};
		} catch {
			return {
				label: "Meta",
				valid: false,
				type: "unknown",
				expiresAt: 0,
				scopes: []
			};
		}
	});
}
async function loadMe() {
	return cached("me", TOKEN_TTL, () => graphFetch(`/me?${qs({ fields: "id,name" })}`, META_USER_TOKEN));
}
async function loadPages() {
	return cached("pages", PAGES_TTL, async () => {
		const raw = await graphList("/me/accounts", META_SYSTEM_TOKEN, {
			fields: "id,name,category,category_list,fan_count,followers_count,about,description,username,picture{url},instagram_business_account{id,username,name,followers_count,media_count,profile_picture_url},access_token",
			limit: 50
		});
		const pages = raw.map((p) => {
			const cats = [p.category, ...(p.category_list ?? []).map((c) => c.name)].filter((x) => Boolean(x && x.trim()));
			const about = [p.about, p.description].filter((x) => Boolean(x && x.trim())).join(" — ").slice(0, 400);
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
				accessToken: p.access_token ?? "EAAQtdvBCMGcBShLQOaWX9nP7z7Bb2Xsgewm77lQvP0sy0WJHHinEKFT7DBPYj7SPzLmZCMacrz5t04w0a9cC8TJg8MRln0hA9hWDRdZAW9Qa1QO3ZCjooENAeCg2e0wIaXZARuaKpaVS8mzVddkCgwrriZCyEpmUjVIbXW9olWNGtr46VzZCYIBI6teaJptwZDZD"
			};
		});
		const instagram = [];
		for (const p of raw) {
			const ig = p.instagram_business_account;
			if (!ig) continue;
			instagram.push({
				id: ig.id,
				username: ig.username ?? "",
				name: ig.name ?? ig.username ?? "Instagram",
				followersCount: ig.followers_count ?? 0,
				mediaCount: ig.media_count ?? 0,
				pictureUrl: ig.profile_picture_url ?? null
			});
		}
		return {
			pages,
			instagram
		};
	});
}
async function getManagedPages() {
	const { pages } = await loadPages();
	return pages;
}
function publicPage(p) {
	const { accessToken: _drop, ...rest } = p;
	return rest;
}
async function loadConversations(pages) {
	return (await Promise.all(pages.map(async (page) => {
		try {
			return (await graphList(`/${page.id}/conversations`, page.accessToken, {
				fields: "id,updated_time,snippet,message_count,unread_count,can_reply,participants",
				limit: 20
			})).map((c) => {
				const other = (c.participants?.data ?? []).filter((part) => part.id !== page.id)[0];
				return {
					id: c.id,
					pageId: page.id,
					pageName: page.name,
					channel: "messenger",
					name: other?.name ?? "Facebook user",
					participantId: other?.id ?? "",
					snippet: c.snippet ?? "",
					updatedAt: c.updated_time ?? "",
					messageCount: c.message_count ?? 0,
					unreadCount: c.unread_count ?? 0,
					canReply: Boolean(c.can_reply)
				};
			});
		} catch {
			return [];
		}
	}))).flat().sort((a, b) => a.updatedAt < b.updatedAt ? 1 : -1);
}
async function loadPosts(pages, limit = 8) {
	return (await Promise.all(pages.map(async (page) => {
		try {
			return (await graphList(`/${page.id}/posts`, page.accessToken, {
				fields: "id,message,created_time,permalink_url,full_picture,shares,likes.summary(true),comments.summary(true)",
				limit
			})).map((post) => ({
				id: post.id,
				pageId: page.id,
				pageName: page.name,
				message: (post.message ?? "").trim(),
				createdAt: post.created_time ?? "",
				permalink: post.permalink_url ?? null,
				picture: post.full_picture ?? null,
				likes: post.likes?.summary?.total_count ?? 0,
				comments: post.comments?.summary?.total_count ?? 0,
				shares: post.shares?.count ?? 0
			}));
		} catch {
			return [];
		}
	}))).flat().sort((a, b) => a.createdAt < b.createdAt ? 1 : -1);
}
async function fetchDashboard() {
	return cached("dashboard", DASH_TTL, async () => {
		const [systemHealth, userHealth, me, bundle] = await Promise.all([
			debugToken(META_SYSTEM_TOKEN),
			debugToken(META_USER_TOKEN),
			loadMe(),
			loadPages()
		]);
		const [threads, posts] = await Promise.all([loadConversations(bundle.pages), loadPosts(bundle.pages, 6)]);
		return {
			operator: {
				id: me.id,
				name: me.name ?? "Connected operator"
			},
			tokenHealth: {
				system: systemHealth,
				user: userHealth
			},
			pages: bundle.pages.map(publicPage),
			instagram: bundle.instagram,
			inbox: {
				unread: threads.reduce((n, t) => n + t.unreadCount, 0),
				recent: threads.slice(0, 8)
			},
			recentPosts: posts.slice(0, 8),
			fetchedAt: (/* @__PURE__ */ new Date()).toISOString()
		};
	});
}
async function fetchInbox() {
	const { pages } = await loadPages();
	return loadConversations(pages);
}
async function fetchConversation(input) {
	const { pages } = await loadPages();
	const page = pages.find((p) => p.id === input.pageId);
	if (!page) throw new GraphError("Page not found");
	const raw = await graphFetch(`/${input.conversationId}?${qs({ fields: "id,can_reply,participants,messages.limit(40){id,message,from,created_time,attachments}" })}`, page.accessToken);
	const other = (raw.participants?.data ?? []).filter((p) => p.id !== page.id)[0];
	const messages = (raw.messages?.data ?? []).map((m) => {
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
			attachmentKind: att ? isImage ? "image" : "file" : null
		};
	}).sort((a, b) => a.createdAt > b.createdAt ? 1 : -1);
	return {
		id: raw.id,
		pageId: page.id,
		pageName: page.name,
		name: other?.name ?? "Facebook user",
		participantId: other?.id ?? "",
		canReply: raw.can_reply !== false,
		messages
	};
}
async function replyConversation(input) {
	const { pages } = await loadPages();
	const page = pages.find((p) => p.id === input.pageId);
	if (!page) return {
		ok: false,
		message: "Page not found"
	};
	const text = input.text.trim();
	if (!text) return {
		ok: false,
		message: "Message is empty"
	};
	if (!input.recipientId) return {
		ok: false,
		message: "Missing recipient"
	};
	try {
		return {
			ok: true,
			id: (await graphFetch(`/${page.id}/messages`, page.accessToken, {
				method: "POST",
				body: {
					recipient: { id: input.recipientId },
					messaging_type: "RESPONSE",
					message: { text }
				}
			})).message_id,
			message: "Sent"
		};
	} catch (err) {
		return {
			ok: false,
			message: err instanceof Error ? err.message : "Could not send message"
		};
	}
}
async function fetchPosts() {
	const { pages } = await loadPages();
	return loadPosts(pages, 12);
}
async function publishToPages(input) {
	const { pages } = await loadPages();
	const message = input.message.trim();
	if (!message) return { results: [{
		pageId: "",
		pageName: "",
		ok: false,
		message: "Write something first"
	}] };
	const targets = pages.filter((p) => input.pageIds.includes(p.id));
	if (targets.length === 0) return { results: [{
		pageId: "",
		pageName: "",
		ok: false,
		message: "Pick a page"
	}] };
	return { results: await Promise.all(targets.map(async (page) => {
		try {
			const body = { message };
			if (input.link?.trim()) body.link = input.link.trim();
			const res = await graphFetch(`/${page.id}/feed`, page.accessToken, {
				method: "POST",
				body
			});
			return {
				pageId: page.id,
				pageName: page.name,
				ok: true,
				id: res.id,
				message: "Published"
			};
		} catch (err) {
			return {
				pageId: page.id,
				pageName: page.name,
				ok: false,
				message: err instanceof Error ? err.message : "Publish failed"
			};
		}
	})) };
}
async function publishMedia(input) {
	const { pages } = await loadPages();
	const page = pages.find((p) => p.id === input.pageId);
	if (!page) return {
		ok: false,
		message: "Page not found"
	};
	const caption = input.message.trim();
	const mediaUrl = input.mediaUrl.trim();
	if (!mediaUrl) return {
		ok: false,
		message: "Missing creative URL"
	};
	const fields = {};
	if (input.scheduledUnix && input.scheduledUnix > Math.floor(Date.now() / 1e3) + 600) {
		fields.published = "false";
		fields.scheduled_publish_time = String(input.scheduledUnix);
	}
	try {
		if (input.mediaKind === "video") return {
			ok: true,
			id: (await graphForm(`/${page.id}/videos`, page.accessToken, {
				file_url: mediaUrl,
				description: caption,
				...fields
			})).id,
			message: fields.scheduled_publish_time ? "Video scheduled" : "Video published"
		};
		const res = await graphForm(`/${page.id}/photos`, page.accessToken, {
			url: mediaUrl,
			caption,
			...fields
		});
		return {
			ok: true,
			id: res.post_id ?? res.id,
			message: fields.scheduled_publish_time ? "Photo scheduled" : "Photo published"
		};
	} catch (err) {
		return {
			ok: false,
			message: err instanceof Error ? err.message : "Could not publish media"
		};
	}
}
async function fetchAccounts() {
	const [systemHealth, userHealth, me, bundle, businesses] = await Promise.all([
		debugToken(META_SYSTEM_TOKEN),
		debugToken(META_USER_TOKEN),
		loadMe(),
		loadPages(),
		cached("businesses", TOKEN_TTL, () => graphList("/me/businesses", META_USER_TOKEN, { fields: "id,name" }).catch(() => []))
	]);
	return {
		operator: {
			id: me.id,
			name: me.name ?? "Connected operator"
		},
		tokenHealth: {
			system: systemHealth,
			user: userHealth
		},
		pages: bundle.pages.map(publicPage),
		instagram: bundle.instagram,
		businesses: businesses.map((b) => ({
			id: b.id,
			name: b.name ?? "Business"
		}))
	};
}
async function graphForm(path, token, fields) {
	const url = `${GRAPH_BASE}${path.startsWith("/") ? path : `/${path}`}`;
	const body = new URLSearchParams();
	for (const [k, v] of Object.entries(fields)) {
		if (v === void 0 || v === "") continue;
		body.set(k, v);
	}
	body.set("access_token", token);
	const res = await fetch(url, {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body
	});
	const json = await res.json();
	if (!res.ok || json.error) {
		const raw = json.error?.error_user_msg || json.error?.message || `Graph request failed (${res.status})`;
		throw new GraphError(json.error?.code === 4 || /request limit/i.test(raw) ? "Meta is briefly rate-limiting this app. Wait a moment, then refresh." : raw, json.error?.code);
	}
	return json;
}
async function fetchAdAccounts() {
	return cached("adaccounts", 18e4, async () => {
		return (await graphList("/me/adaccounts", META_USER_TOKEN, {
			fields: "id,name,account_status,currency,amount_spent,business_name",
			limit: 25
		})).map((a) => ({
			id: a.id,
			name: a.name ?? a.id,
			status: a.account_status ?? 0,
			currency: a.currency ?? "",
			spent: a.amount_spent ?? "0",
			businessName: a.business_name ?? null
		}));
	});
}
async function fetchCampaigns(accountId, limit = 8) {
	const id = accountId.startsWith("act_") ? accountId : `act_${accountId}`;
	return (await graphList(`/${id}/campaigns`, META_USER_TOKEN, {
		fields: "id,name,objective,status,created_time",
		limit
	})).map((c) => ({
		id: c.id,
		accountId: id,
		name: c.name ?? "Untitled campaign",
		objective: c.objective ?? "",
		status: c.status ?? "",
		createdAt: c.created_time ?? ""
	}));
}
function normalizeObjective(raw) {
	const s = raw.trim().toUpperCase().replace(/[\s-]+/g, "_");
	const map = {
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
		APP_INSTALLS: "OUTCOME_APP_PROMOTION"
	};
	if (s.startsWith("OUTCOME_")) return s;
	return map[s] ?? "OUTCOME_TRAFFIC";
}
function optimizationFor(objective) {
	switch (objective) {
		case "OUTCOME_AWARENESS": return "REACH";
		case "OUTCOME_ENGAGEMENT": return "CONVERSATIONS";
		case "OUTCOME_LEADS": return "LEAD_GENERATION";
		case "OUTCOME_SALES": return "OFFSITE_CONVERSIONS";
		case "OUTCOME_APP_PROMOTION": return "APP_INSTALLS";
		default: return "LINK_CLICKS";
	}
}
async function createCampaign(input) {
	const accounts = await fetchAdAccounts();
	const wanted = (input.accountId ?? "").replace(/^act_/, "").toLowerCase();
	const account = accounts.find((a) => a.id.replace(/^act_/, "").toLowerCase() === wanted || a.name.toLowerCase() === wanted || a.id.toLowerCase() === `act_${wanted}`) ?? accounts[0];
	if (!account) return {
		ok: false,
		message: "No ad account is connected."
	};
	const name = input.name.trim();
	if (!name) return {
		ok: false,
		message: "Campaign needs a name."
	};
	const objective = normalizeObjective(input.objective || "OUTCOME_TRAFFIC");
	const act = account.id.startsWith("act_") ? account.id : `act_${account.id}`;
	try {
		const created = await graphForm(`/${act}/campaigns`, META_USER_TOKEN, {
			name,
			objective,
			status: "PAUSED",
			special_ad_categories: "[]"
		});
		if (!created.id) return {
			ok: false,
			message: "Meta did not return a campaign id."
		};
		const extra = {
			accountId: act,
			accountName: account.name,
			currency: account.currency,
			objective
		};
		if (input.dailyBudget && input.dailyBudget > 0) {
			const minor = Math.round(input.dailyBudget * 100);
			try {
				const set = await graphForm(`/${act}/adsets`, META_USER_TOKEN, {
					name: `${name} — ad set`,
					campaign_id: created.id,
					daily_budget: String(minor),
					billing_event: "IMPRESSIONS",
					optimization_goal: optimizationFor(objective),
					targeting: JSON.stringify({ geo_locations: { countries: ["PH"] } }),
					status: "PAUSED"
				});
				if (set.id) extra.adSetId = set.id;
				extra.dailyBudget = `${input.dailyBudget} ${account.currency}/day`;
			} catch (err) {
				extra.adSetNote = err instanceof Error ? `Campaign created; ad set skipped (${err.message})` : "Campaign created; ad set skipped.";
			}
		}
		return {
			ok: true,
			id: created.id,
			extra,
			message: `Paused campaign “${name}” is live in Ads Manager.`
		};
	} catch (err) {
		return {
			ok: false,
			message: err instanceof Error ? err.message : "Could not create the campaign."
		};
	}
}
var EMPTY_SNAPSHOT = () => ({
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
		saved: false
	}
});
var snapshotInflight = null;
function isThinSnapshot(s) {
	return s.pages.length === 0 && s.adAccounts.length === 0;
}
async function fetchOperatorSnapshot() {
	if (snapshotInflight) return snapshotInflight;
	const run = (async () => {
		const hit = mem.get("operator-snapshot");
		const ttl = hit && isThinSnapshot(hit.value) ? 2e4 : 18e4;
		if (hit && Date.now() - hit.at < ttl) return hit.value;
		const snap = EMPTY_SNAPSHOT();
		try {
			snap.operator = (await loadMe()).name ?? snap.operator;
		} catch {}
		try {
			const bundle = await loadPages();
			snap.pages = bundle.pages.map((p) => ({
				id: p.id,
				name: p.name,
				fans: p.fanCount,
				category: p.category,
				about: p.about
			}));
			snap.instagram = bundle.instagram.map((ig) => ({
				id: ig.id,
				username: ig.username,
				followers: ig.followersCount
			}));
		} catch {}
		try {
			snap.adAccounts = await fetchAdAccounts();
		} catch {}
		mem.set("operator-snapshot", {
			at: Date.now(),
			value: snap
		});
		return snap;
	})().finally(() => {
		snapshotInflight = null;
	});
	snapshotInflight = run;
	const data = await run;
	try {
		const wa = await import("./baileys.server-BlSjz9yw.mjs");
		wa.ensureStarted();
		data.whatsappLink = wa.getLinkSummary();
	} catch {}
	return data;
}
//#endregion
export { createCampaign, fetchAccounts, fetchCampaigns, fetchConversation, fetchDashboard, fetchInbox, fetchOperatorSnapshot, fetchPosts, getManagedPages, META_USER_TOKEN as n, publishMedia, publishToPages, replyConversation, GRAPH_BASE as t };
