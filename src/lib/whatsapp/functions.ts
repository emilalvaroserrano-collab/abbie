import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const getWhatsAppStatus = createServerFn({ method: "GET" }).handler(async () => {
  const wa = await import("./baileys.server");
  return wa.waitForLink();
});

export const startWhatsAppLink = createServerFn({ method: "POST" }).handler(async () => {
  const wa = await import("./baileys.server");
  return wa.waitForLink();
});

export const requestWhatsAppPairing = createServerFn({ method: "POST" })
  .validator(z.object({ phone: z.string().min(8).max(20) }))
  .handler(async ({ data }) => {
    const wa = await import("./baileys.server");
    return wa.requestPairing(data.phone);
  });

export const sendWhatsAppMessage = createServerFn({ method: "POST" })
  .validator(z.object({ to: z.string().min(8).max(20), text: z.string().min(1).max(2000) }))
  .handler(async ({ data }) => {
    const wa = await import("./baileys.server");
    return wa.sendWhatsAppText(data.to, data.text);
  });

export const logoutWhatsAppLink = createServerFn({ method: "POST" }).handler(async () => {
  const wa = await import("./baileys.server");
  return wa.logoutWhatsApp();
});
