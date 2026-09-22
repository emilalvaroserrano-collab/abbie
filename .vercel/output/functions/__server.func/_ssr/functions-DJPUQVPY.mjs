import { t as createServerFn } from "./ssr.mjs";
import { t as createServerRpc } from "./createServerRpc-A6pJPYTF.mjs";
import { o as object, s as string } from "../_libs/zod.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/functions-DJPUQVPY.js
var getWhatsAppStatus_createServerFn_handler = createServerRpc({
	id: "c99399d4ec1f3c1ba13a388cd1525f0f88667dd4340dd1d4742f09557b6c1239",
	name: "getWhatsAppStatus",
	filename: "src/lib/whatsapp/functions.ts"
}, (opts) => getWhatsAppStatus.__executeServer(opts));
var getWhatsAppStatus = createServerFn({ method: "GET" }).handler(getWhatsAppStatus_createServerFn_handler, async () => {
	return (await import("./baileys.server-BlSjz9yw.mjs")).waitForLink();
});
var startWhatsAppLink_createServerFn_handler = createServerRpc({
	id: "2c60afcbafe283adab2aa3bc4747618252771b291b80eacd584a308b15f9eb9d",
	name: "startWhatsAppLink",
	filename: "src/lib/whatsapp/functions.ts"
}, (opts) => startWhatsAppLink.__executeServer(opts));
var startWhatsAppLink = createServerFn({ method: "POST" }).handler(startWhatsAppLink_createServerFn_handler, async () => {
	return (await import("./baileys.server-BlSjz9yw.mjs")).waitForLink();
});
var requestWhatsAppPairing_createServerFn_handler = createServerRpc({
	id: "7b44fd1dd6d6c73dc43a322ebf28687fcd246ba5b626cb98bf5974eb7010329d",
	name: "requestWhatsAppPairing",
	filename: "src/lib/whatsapp/functions.ts"
}, (opts) => requestWhatsAppPairing.__executeServer(opts));
var requestWhatsAppPairing = createServerFn({ method: "POST" }).validator(object({ phone: string().min(8).max(20) })).handler(requestWhatsAppPairing_createServerFn_handler, async ({ data }) => {
	return (await import("./baileys.server-BlSjz9yw.mjs")).requestPairing(data.phone);
});
var logoutWhatsAppLink_createServerFn_handler = createServerRpc({
	id: "a712c54ef250ea32b33178838d0920487eb9cddbeab7d8abd6965a44b10ce3ad",
	name: "logoutWhatsAppLink",
	filename: "src/lib/whatsapp/functions.ts"
}, (opts) => logoutWhatsAppLink.__executeServer(opts));
var logoutWhatsAppLink = createServerFn({ method: "POST" }).handler(logoutWhatsAppLink_createServerFn_handler, async () => {
	return (await import("./baileys.server-BlSjz9yw.mjs")).logoutWhatsApp();
});
//#endregion
export { getWhatsAppStatus_createServerFn_handler, logoutWhatsAppLink_createServerFn_handler, requestWhatsAppPairing_createServerFn_handler, startWhatsAppLink_createServerFn_handler };
