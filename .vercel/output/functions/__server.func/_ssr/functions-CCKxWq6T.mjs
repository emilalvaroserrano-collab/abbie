import { t as createServerFn } from "./ssr.mjs";
import { t as createServerRpc } from "./createServerRpc-A6pJPYTF.mjs";
import { o as object, s as string } from "../_libs/zod.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/functions-CCKxWq6T.js
var getStudioSchedule_createServerFn_handler = createServerRpc({
	id: "c989707bb1936c41e47b55fe6811b0baed2ad8c4d1cee7d4ee0bd6c41e3125c0",
	name: "getStudioSchedule",
	filename: "src/lib/studio/functions.ts"
}, (opts) => getStudioSchedule.__executeServer(opts));
var getStudioSchedule = createServerFn({ method: "GET" }).handler(getStudioSchedule_createServerFn_handler, async () => {
	try {
		return {
			data: await (await import("./schedule.server-BcYEmHW4.mjs")).listStudio(),
			error: null
		};
	} catch (e) {
		return {
			data: null,
			error: e instanceof Error ? e.message : "Could not load the schedule."
		};
	}
});
var tickStudioSchedule_createServerFn_handler = createServerRpc({
	id: "a61abbf46cb5555f6c8b62d76df4cdbf39b794e54981ce14a91434fb4ba4442f",
	name: "tickStudioSchedule",
	filename: "src/lib/studio/functions.ts"
}, (opts) => tickStudioSchedule.__executeServer(opts));
var tickStudioSchedule = createServerFn({ method: "POST" }).handler(tickStudioSchedule_createServerFn_handler, async () => {
	try {
		return {
			data: await (await import("./schedule.server-BcYEmHW4.mjs")).tickStudio(),
			error: null
		};
	} catch (e) {
		return {
			data: null,
			error: e instanceof Error ? e.message : "Could not run the schedule."
		};
	}
});
var pauseStudioCampaign_createServerFn_handler = createServerRpc({
	id: "1676b2c876b8c73d846be70bd050990c60a1b28ac9efc48b0b48645cc84df644",
	name: "pauseStudioCampaign",
	filename: "src/lib/studio/functions.ts"
}, (opts) => pauseStudioCampaign.__executeServer(opts));
var pauseStudioCampaign = createServerFn({ method: "POST" }).validator(object({ id: string().min(8).max(80) })).handler(pauseStudioCampaign_createServerFn_handler, async ({ data }) => {
	return (await import("./schedule.server-BcYEmHW4.mjs")).pauseCampaign(data.id);
});
var pollStudioJob_createServerFn_handler = createServerRpc({
	id: "bad154fc7932e5df8c5c4d97c3c71296872e353fd8175b08d5eac5a2bcf798a2",
	name: "pollStudioJob",
	filename: "src/lib/studio/functions.ts"
}, (opts) => pollStudioJob.__executeServer(opts));
var pollStudioJob = createServerFn({ method: "POST" }).validator(object({ id: string().min(8).max(80) })).handler(pollStudioJob_createServerFn_handler, async ({ data }) => {
	try {
		const job = await (await import("./imagine.server-CaOQg72o.mjs")).refreshJob(data.id);
		if (!job) return {
			status: "failed",
			mediaUrl: null,
			error: "That render expired.",
			mediaKind: "video"
		};
		return {
			status: job.status,
			mediaUrl: job.mediaUrl,
			error: job.error,
			mediaKind: job.kind === "video" ? "video" : "image"
		};
	} catch (e) {
		return {
			status: "pending",
			mediaUrl: null,
			error: e instanceof Error ? e.message : null,
			mediaKind: "video"
		};
	}
});
//#endregion
export { getStudioSchedule_createServerFn_handler, pauseStudioCampaign_createServerFn_handler, pollStudioJob_createServerFn_handler, tickStudioSchedule_createServerFn_handler };
