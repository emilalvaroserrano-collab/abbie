# Abbie CSR — deployment

The web app is a Vercel-ready call-center CRM frontend. The browser never receives provider or LiveKit signing secrets.

## Runtime architecture

1. Browser opens the CRM and dialer.
2. `POST /api/livekit-token` mints a short-lived LiveKit participant token on the server.
3. The token joins an opaque room and explicitly dispatches the `AbbieCSR` agent.
4. The browser publishes microphone audio and subscribes to Abbie's audio.
5. LiveKit transcription events are rendered in the CRM transcript panel.

## Vercel environment variables

Configure these as encrypted server-side variables for Production and Preview:

- `LIVEKIT_URL`
- `LIVEKIT_API_KEY`
- `LIVEKIT_API_SECRET`

Do not prefix them with `VITE_` and do not commit their values.

## Voice worker environment

The separate LiveKit Python worker uses:

- `LIVEKIT_URL`
- `LIVEKIT_API_KEY`
- `LIVEKIT_API_SECRET`
- `GOOGLE_API_KEY`
- `CARTESIA_API_KEY`

The worker is registered as `AbbieCSR`. The supplied worker package uses Gemini for the LLM and Cartesia Sonic for TTS; it should be deployed as a persistent LiveKit agent worker, not as a Vercel serverless function.

## Web deployment

Import this repository into Vercel and deploy the `main` branch. The existing Vite/TanStack Start build and `vercel.json` are retained.

After the web deployment is live, start/deploy the `AbbieCSR` worker and press **Call** in the CRM dialer. If the worker is not online, the room can connect but no agent will answer.
