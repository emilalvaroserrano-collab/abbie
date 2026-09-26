import { createFileRoute } from "@tanstack/react-router";
import { SignJWT } from "jose";

export const Route = createFileRoute("/api/livekit-token")({
  server: {
    handlers: {
      POST: async () => {
        const serverUrl = process.env.LIVEKIT_URL;
        const apiKey = process.env.LIVEKIT_API_KEY;
        const apiSecret = process.env.LIVEKIT_API_SECRET;

        if (!serverUrl || !apiKey || !apiSecret) {
          return Response.json(
            { error: "LiveKit server credentials are not configured." },
            { status: 503 },
          );
        }

        const roomName = "abbie-" + crypto.randomUUID();
        const identity = "web-" + crypto.randomUUID();
        const now = Math.floor(Date.now() / 1000);

        const token = await new SignJWT({
          video: {
            room: roomName,
            roomJoin: true,
            canPublish: true,
            canSubscribe: true,
            canPublishData: true,
          },
          roomConfig: {
            agents: [{ agentName: "AbbieCSR", metadata: "{\"source\":\"csr-dashboard\"}" }],
          },
        })
          .setProtectedHeader({ alg: "HS256", typ: "JWT" })
          .setIssuer(apiKey)
          .setSubject(identity)
          .setNotBefore(now)
          .setExpirationTime(now + 600)
          .sign(new TextEncoder().encode(apiSecret));

        return Response.json(
          { server_url: serverUrl, participant_token: token },
          { status: 201, headers: { "Cache-Control": "no-store" } },
        );
      },
    },
  },
});
