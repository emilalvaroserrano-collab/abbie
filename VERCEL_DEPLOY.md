# Abbie deployment

## Vercel

The web application and Abbie's realtime voice experience run from the repository root.

### Required voice environment

```env
GEMINI_API_KEY=
```

Keep `GEMINI_API_KEY` server-side. The browser requests a one-use, short-lived Gemini Live ephemeral token from `/api/gemini-live-token`; the permanent key is never sent to browser code.

## Live Audio architecture

Abbie now uses Gemini Live Audio directly:

browser microphone -> Gemini Live Audio -> native audio response -> browser speaker

Model: `models/gemini-3.8-live`

The browser sends raw mono 16-bit PCM audio at 16 kHz and plays the returned raw PCM audio at 24 kHz. Input/output transcription is enabled for the CSR dashboard. Server-side VAD handles conversational turns and interruption clears queued playback for natural barge-in.

The previous LiveKit/Deepgram/Ollama/Cartesia worker is no longer part of the active web-call path.

## Other application environment

Keep the database, Meta, xAI, and optional auth environment variables required by the rest of the dashboard/features. Do not use a `VITE_` prefix for secret credentials.
