import { getManagedPages, n as META_USER_TOKEN, t as GRAPH_BASE } from "./graph.server-CjL3s8xK.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/leads.server-BX8ATHyS.js
async function graphGet(path, token) {
	const url = new URL(`${GRAPH_BASE}${path.startsWith("/") ? path : `/${path}`}`);
	url.searchParams.set("access_token", token);
	const res = await fetch(url);
	const json = await res.json();
	if (!res.ok || json.error) {
		const raw = json.error?.message || `Graph failed (${res.status})`;
		throw new Error(json.error?.code === 4 || /request limit/i.test(raw) ? "Meta is briefly rate-limiting this app. Wait a moment, then refresh." : raw);
	}
	return json;
}
async function graphList(path, token) {
	try {
		return (await graphGet(path, token)).data ?? [];
	} catch {
		return [];
	}
}
function keywordsFor(pages, extra) {
	const bag = /* @__PURE__ */ new Set();
	const add = (s) => {
		for (const w of s.toLowerCase().replace(/[^a-z0-9+.# ]/g, " ").split(/\s+/).filter((x) => x.length >= 3)) bag.add(w);
	};
	for (const p of pages) {
		add(p.name);
		add(p.category);
		add(p.about);
	}
	add(extra);
	for (const keep of [
		"software",
		"app",
		"developer",
		"website",
		"chatbot",
		"ai",
		"system",
		"quote",
		"price",
		"inquiry",
		"avail",
		"need",
		"project",
		"it"
	]) bag.add(keep);
	return [...bag].filter((w) => !STOP.has(w));
}
var STOP = /* @__PURE__ */ new Set([
	"the",
	"and",
	"for",
	"with",
	"from",
	"that",
	"this",
	"your",
	"you",
	"our",
	"are",
	"was",
	"page",
	"company",
	"inc",
	"ltd",
	"www",
	"http",
	"https",
	"com"
]);
function scoreText(text, keys) {
	const hay = text.toLowerCase();
	let n = 0;
	for (const k of keys) if (k.length >= 4 && hay.includes(k)) n += 1;
	if (/\b(need|quote|price|avail|inquire|inquiry|po\b|interested|budget|develop|website|app)\b/i.test(text)) n += 2;
	return n;
}
function whenOf(raw) {
	if (!raw) return null;
	const d = new Date(raw);
	return Number.isNaN(d.getTime()) ? raw : d.toISOString();
}
function recencyBoost(iso) {
	if (!iso) return 0;
	const days = (Date.now() - new Date(iso).getTime()) / 864e5;
	if (days < 7) return 12;
	if (days < 30) return 8;
	if (days < 90) return 4;
	return 0;
}
function fieldMap(fields) {
	const out = {};
	for (const f of fields ?? []) {
		const key = (f.name ?? "").toLowerCase();
		const val = (f.values ?? []).filter(Boolean).join(", ");
		if (key && val) out[key] = val;
	}
	return out;
}
function contactFrom(fields) {
	return [fields.email || fields["work email"] || fields["e-mail"], fields.phone_number || fields.phone || fields.mobile].filter(Boolean).join(" · ") || null;
}
function formatAudience(lo, hi) {
	const fmt = (n) => n >= 1e9 ? `${(n / 1e9).toFixed(1)}B` : n >= 1e6 ? `${Math.round(n / 1e6)}M` : n >= 1e3 ? `${Math.round(n / 1e3)}K` : String(n);
	if (!lo && !hi) return void 0;
	if (lo && hi) return `${fmt(lo)}–${fmt(hi)}`;
	return fmt(lo || hi || 0);
}
var SOURCE_RANK = {
	form: 95,
	messenger: 72,
	comment: 54,
	mention: 58,
	page: 42,
	audience: 36
};
async function collectForms(page, keys) {
	const forms = await graphList(`/${page.id}/leadgen_forms?fields=id,name,status,leads_count&limit=12`, page.accessToken);
	const out = [];
	for (const form of forms) {
		if (!form.leads_count) continue;
		const leads = await graphList(`/${form.id}/leads?fields=id,created_time,field_data&limit=25`, page.accessToken);
		for (const lead of leads) {
			const fields = fieldMap(lead.field_data);
			const name = fields.full_name || fields.name || fields["first_name"] || "Lead form reply";
			const snippet = Object.values(fields).slice(0, 4).join(" · ");
			const fit = scoreText(`${name} ${snippet}`, keys);
			out.push({
				id: `form:${lead.id}`,
				source: "form",
				name,
				score: Math.min(99, SOURCE_RANK.form + fit * 2 + recencyBoost(whenOf(lead.created_time))),
				reason: `Submitted “${form.name ?? "lead form"}”`,
				pageName: page.name,
				pageId: page.id,
				snippet: snippet || form.name || "Lead form",
				contact: contactFrom(fields),
				when: whenOf(lead.created_time)
			});
		}
	}
	return out;
}
async function collectInbox(page, keys) {
	const convs = await graphList(`/${page.id}/conversations?fields=id,snippet,unread_count,updated_time,message_count,participants&limit=20`, page.accessToken);
	const out = [];
	for (const c of convs) {
		const other = (c.participants?.data ?? []).find((p) => p.id !== page.id);
		const name = other?.name?.trim() || "Facebook user";
		if (name === page.name) continue;
		const snippet = (c.snippet ?? "").replace(/\s+/g, " ").trim();
		if (!snippet || /^message unavailable$/i.test(snippet)) continue;
		if (/assigned this conversation|facebook nalog/i.test(snippet)) continue;
		const fit = scoreText(snippet, keys);
		const unread = c.unread_count ?? 0;
		const score = SOURCE_RANK.messenger + (unread ? 14 : 0) + Math.min(12, (c.message_count ?? 0) > 2 ? 6 : 0) + fit * 4 + recencyBoost(whenOf(c.updated_time));
		out.push({
			id: `msg:${c.id}`,
			source: "messenger",
			name,
			score: Math.min(98, score),
			reason: unread ? "Unread Messenger thread" : "Messaged the page",
			pageName: page.name,
			pageId: page.id,
			snippet: snippet.slice(0, 160),
			contact: null,
			when: whenOf(c.updated_time),
			conversationId: c.id,
			participantId: other?.id
		});
	}
	return out;
}
async function collectComments(page, keys) {
	const posts = await graphList(`/${page.id}/feed?fields=id,message,comments.limit(8){id,from,message,created_time}&limit=5`, page.accessToken);
	const out = [];
	for (const post of posts) for (const c of post.comments?.data ?? []) {
		const name = c.from?.name?.trim();
		if (!name || name === page.name) continue;
		const snippet = (c.message ?? "").trim();
		if (!snippet) continue;
		const fit = scoreText(snippet, keys);
		out.push({
			id: `cmt:${c.id}`,
			source: "comment",
			name,
			score: Math.min(90, SOURCE_RANK.comment + fit * 5 + recencyBoost(whenOf(c.created_time))),
			reason: "Commented on a page post",
			pageName: page.name,
			pageId: page.id,
			snippet: snippet.slice(0, 160),
			contact: null,
			when: whenOf(c.created_time)
		});
	}
	return out;
}
async function collectMentions(page, keys) {
	const tagged = await graphList(`/${page.id}/tagged?fields=id,from,message,created_time&limit=10`, page.accessToken);
	const out = [];
	for (const t of tagged) {
		const name = t.from?.name?.trim();
		if (!name || name === page.name) continue;
		const snippet = (t.message ?? "").trim();
		out.push({
			id: `tag:${t.id}`,
			source: "mention",
			name,
			score: Math.min(88, SOURCE_RANK.mention + scoreText(snippet, keys) * 4 + recencyBoost(whenOf(t.created_time))),
			reason: "Tagged the page",
			pageName: page.name,
			pageId: page.id,
			snippet: snippet.slice(0, 160) || "Mention",
			contact: null,
			when: whenOf(t.created_time)
		});
	}
	return out;
}
async function collectAudiences(pages, keys) {
	const cat = (pages[0]?.category ?? "").toLowerCase();
	const terms = [
		cat.includes("software") || cat.includes("tech") ? "software" : null,
		cat.includes("software") || cat.includes("tech") ? "artificial intelligence" : null,
		keys.find((k) => /software|tech|ai|app|food|salon|clinic|construct|estate/.test(k)),
		pages[0]?.category?.split(/[,&]/)[0]?.trim(),
		"software"
	].filter((x, i, a) => Boolean(x) && a.indexOf(x) === i);
	const rows = [];
	for (const term of terms.slice(0, 2)) {
		const batch = await graphList(`/search?type=adinterest&q=${encodeURIComponent(term)}&limit=6`, META_USER_TOKEN);
		rows.push(...batch);
	}
	const seen = /* @__PURE__ */ new Set();
	const out = [];
	for (const row of rows) {
		if (!row.id || seen.has(row.id)) continue;
		seen.add(row.id);
		const size = formatAudience(row.audience_size_lower_bound, row.audience_size_upper_bound);
		out.push({
			id: `aud:${row.id}`,
			source: "audience",
			name: row.name ?? "Interest",
			score: SOURCE_RANK.audience,
			reason: "People interested in this — target in ads (PH)",
			pageName: pages[0]?.name ?? "Ads",
			pageId: pages[0]?.id ?? "",
			snippet: (row.path ?? []).slice(-3).join(" · ") || row.topic || "Meta interest",
			contact: null,
			when: null,
			audienceSize: size
		});
	}
	return out.slice(0, 10);
}
function collectPages(pages, keys) {
	return pages.map((p) => {
		const fit = scoreText(`${p.name} ${p.category} ${p.about}`, keys);
		return {
			id: `page:${p.id}`,
			source: "page",
			name: p.name,
			score: SOURCE_RANK.page + Math.min(12, fit),
			reason: p.category ? `${p.category}` : "Connected page",
			pageName: p.name,
			pageId: p.id,
			snippet: (p.about || "Your page").slice(0, 160),
			contact: null,
			when: null
		};
	});
}
function matchesQuery(lead, q) {
	if (!q) return true;
	const hay = `${lead.name} ${lead.snippet} ${lead.reason} ${lead.pageName} ${lead.source}`.toLowerCase();
	return q.toLowerCase().split(/\s+/).filter(Boolean).every((w) => hay.includes(w));
}
var mem = /* @__PURE__ */ new Map();
async function fetchLeadBoard(input = {}) {
	const query = (input.query ?? "").trim();
	const cacheKey = `${input.pageId ?? "all"}|${(input.sources ?? []).join(",")}|${query}`;
	const hit = mem.get(cacheKey);
	if (hit && Date.now() - hit.at < 45e3) return {
		...hit.value,
		leads: hit.value.leads.filter((l) => matchesQuery(l, query)).slice(0, input.limit ?? 40)
	};
	const allPages = await getManagedPages();
	const pages = input.pageId ? allPages.filter((p) => p.id === input.pageId) : allPages;
	const notes = [];
	if (!pages.length) return {
		query,
		generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
		counts: {},
		leads: [],
		notes: ["No Facebook Page is connected."]
	};
	const keys = keywordsFor(pages, query);
	const wanted = new Set(input.sources ?? []);
	const use = (s) => wanted.size === 0 || wanted.has(s);
	const collected = [];
	for (const page of pages.slice(0, 4)) {
		if (use("form")) collected.push(...await collectForms(page, keys));
		if (use("messenger")) collected.push(...await collectInbox(page, keys));
		if (use("comment")) collected.push(...await collectComments(page, keys));
		if (use("mention")) collected.push(...await collectMentions(page, keys));
	}
	if (use("page")) collected.push(...collectPages(pages, keys));
	if (use("audience")) try {
		collected.push(...await collectAudiences(pages, keys));
	} catch (err) {
		notes.push(err instanceof Error ? err.message : "Could not load ad audiences.");
	}
	const seen = /* @__PURE__ */ new Set();
	const unique = collected.filter((l) => {
		const k = `${l.source}:${l.name.toLowerCase()}:${l.pageId}`;
		if (seen.has(k)) return false;
		seen.add(k);
		return matchesQuery(l, query);
	});
	const rank = (a, b) => b.score - a.score;
	const warm = unique.filter((l) => l.source !== "audience" && l.source !== "page").sort(rank).slice(0, Math.min(input.limit ?? 24, 32));
	const pageHits = unique.filter((l) => l.source === "page").sort(rank);
	const audiences = unique.filter((l) => l.source === "audience").sort(rank).slice(0, 8);
	const leads = [
		...warm,
		...pageHits,
		...audiences
	];
	const counts = {};
	for (const l of leads) counts[l.source] = (counts[l.source] ?? 0) + 1;
	if (!leads.some((l) => l.source === "form")) notes.push("No filled lead forms yet — chats and comments still count.");
	notes.push("Meta does not give a list of strangers who might like the business. These are people who already engaged, plus matching ad audiences.");
	const board = {
		query,
		generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
		counts,
		leads,
		notes
	};
	mem.set(cacheKey, {
		at: Date.now(),
		value: board
	});
	return board;
}
//#endregion
export { fetchLeadBoard };
