import { t as createServerFn } from "./ssr.mjs";
import { t as createServerRpc } from "./createServerRpc-A6pJPYTF.mjs";
import { n as array, o as object, s as string } from "../_libs/zod.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/functions-GPcNOkg2.js
function metaErrorMessage(err) {
	const msg = err instanceof Error ? err.message : String(err);
	if (/request limit/i.test(msg) || /\(#4\)/.test(msg)) return "Meta is briefly rate-limiting this app. Wait a moment, then refresh — your accounts are still connected.";
	return msg;
}
async function guard(fn) {
	try {
		return {
			data: await fn(),
			error: null
		};
	} catch (e) {
		return {
			data: null,
			error: metaErrorMessage(e)
		};
	}
}
var getDashboard_createServerFn_handler = createServerRpc({
	id: "598ee5ee960442c3e45f3f8e6f71f71345d5360ced1d54cfe62dbab73b0391ed",
	name: "getDashboard",
	filename: "src/lib/meta/functions.ts"
}, (opts) => getDashboard.__executeServer(opts));
var getDashboard = createServerFn({ method: "GET" }).handler(getDashboard_createServerFn_handler, async () => {
	const { fetchDashboard } = await import("./graph.server-CjL3s8xK.mjs");
	return guard(() => fetchDashboard());
});
var getInbox_createServerFn_handler = createServerRpc({
	id: "37e829d8f67658a37840205154bc43cd0400f4c3cfe8d41ad0bcaf2d7be4e82e",
	name: "getInbox",
	filename: "src/lib/meta/functions.ts"
}, (opts) => getInbox.__executeServer(opts));
var getInbox = createServerFn({ method: "GET" }).handler(getInbox_createServerFn_handler, async () => {
	const { fetchInbox } = await import("./graph.server-CjL3s8xK.mjs");
	return guard(() => fetchInbox());
});
var getConversation_createServerFn_handler = createServerRpc({
	id: "c619a3eea344d9ad087624a921224058ab56cba72939029523969b9a7d434ead",
	name: "getConversation",
	filename: "src/lib/meta/functions.ts"
}, (opts) => getConversation.__executeServer(opts));
var getConversation = createServerFn({ method: "POST" }).validator(object({
	pageId: string().min(1),
	conversationId: string().min(1)
})).handler(getConversation_createServerFn_handler, async ({ data }) => {
	const { fetchConversation } = await import("./graph.server-CjL3s8xK.mjs");
	return guard(() => fetchConversation(data));
});
var sendReply_createServerFn_handler = createServerRpc({
	id: "a3df0e366d80d0e1f8470d798d8bee51806d1fce2b83ee38305083e4cdf5a26a",
	name: "sendReply",
	filename: "src/lib/meta/functions.ts"
}, (opts) => sendReply.__executeServer(opts));
var sendReply = createServerFn({ method: "POST" }).validator(object({
	pageId: string().min(1),
	recipientId: string().min(1),
	text: string().min(1).max(2e3)
})).handler(sendReply_createServerFn_handler, async ({ data }) => {
	const { replyConversation } = await import("./graph.server-CjL3s8xK.mjs");
	return replyConversation(data);
});
var getPosts_createServerFn_handler = createServerRpc({
	id: "5af26b65bc4ea1127bc968d7135d27c5356798130fbaa1fb2b1ab120f8657dee",
	name: "getPosts",
	filename: "src/lib/meta/functions.ts"
}, (opts) => getPosts.__executeServer(opts));
var getPosts = createServerFn({ method: "GET" }).handler(getPosts_createServerFn_handler, async () => {
	const { fetchPosts } = await import("./graph.server-CjL3s8xK.mjs");
	return guard(() => fetchPosts());
});
var publishPost_createServerFn_handler = createServerRpc({
	id: "e1199b46e59d91a67a6b30449efbbdab293e2d63040d0e2ba7cba468700fcce8",
	name: "publishPost",
	filename: "src/lib/meta/functions.ts"
}, (opts) => publishPost.__executeServer(opts));
var publishPost = createServerFn({ method: "POST" }).validator(object({
	pageIds: array(string()).min(1),
	message: string().min(1).max(63206),
	link: string().optional()
})).handler(publishPost_createServerFn_handler, async ({ data }) => {
	const { publishToPages } = await import("./graph.server-CjL3s8xK.mjs");
	return publishToPages(data);
});
var getAccounts_createServerFn_handler = createServerRpc({
	id: "6b05301f3bea0ddf8ba00d83045ba2159fc796437f50013602a1c105418502ed",
	name: "getAccounts",
	filename: "src/lib/meta/functions.ts"
}, (opts) => getAccounts.__executeServer(opts));
var getAccounts = createServerFn({ method: "GET" }).handler(getAccounts_createServerFn_handler, async () => {
	const { fetchAccounts } = await import("./graph.server-CjL3s8xK.mjs");
	return guard(() => fetchAccounts());
});
var getLeadBoard_createServerFn_handler = createServerRpc({
	id: "43a4968c278ac56ce4b23ef7eb09693e2920f08b2a77ee0a0e24b5d694118f8f",
	name: "getLeadBoard",
	filename: "src/lib/meta/functions.ts"
}, (opts) => getLeadBoard.__executeServer(opts));
var getLeadBoard = createServerFn({ method: "POST" }).validator(object({
	query: string().max(120).optional(),
	pageId: string().optional()
})).handler(getLeadBoard_createServerFn_handler, async ({ data }) => {
	const { fetchLeadBoard } = await import("./leads.server-BX8ATHyS.mjs");
	return guard(() => fetchLeadBoard({
		query: data.query,
		pageId: data.pageId,
		limit: 40
	}));
});
//#endregion
export { getAccounts_createServerFn_handler, getConversation_createServerFn_handler, getDashboard_createServerFn_handler, getInbox_createServerFn_handler, getLeadBoard_createServerFn_handler, getPosts_createServerFn_handler, publishPost_createServerFn_handler, sendReply_createServerFn_handler };
