import { GoogleGenAI } from "@google/genai";
import { createFileRoute } from "@tanstack/react-router";

const MODEL = "models/gemini-3.8-live";

export const Route = createFileRoute("/api/gemini-live-token")({
  server: {
    handlers: {
      POST: async () => {
        const apiKey = process.env.GEMINI_API_KEY?.trim();
        if (!apiKey) {
          return Response.json(
            { error: "Live audio is not configured." },
            { status: 503, headers: { "Cache-Control": "no-store" } },
          );
        }

        try {
          const ai = new GoogleGenAI({ apiKey, apiVersion: "v1beta" });
          const token = await ai.authTokens.create({
            config: {
              uses: 1,
              expireTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
              newSessionExpireTime: new Date(Date.now() + 60 * 1000).toISOString(),
              liveConnectConstraints: { model: MODEL },
              lockAdditionalFields: [],
            },
          });

          if (!token.name) throw new Error("Gemini did not return an ephemeral token.");
          return Response.json(
            { token: token.name },
            { status: 201, headers: { "Cache-Control": "no-store" } },
          );
        } catch (error) {
          console.error("Gemini Live token creation failed", error);
          return Response.json(
            { error: "Could not create a secure live audio session." },
            { status: 502, headers: { "Cache-Control": "no-store" } },
          );
        }
      },
    },
  },
});
