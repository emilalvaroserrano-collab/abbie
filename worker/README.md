# AbbieCSR LiveKit Worker

Voice worker for ABI Tech's Abbie customer-service agent.

## Current LiveKit Inference stack

- STT: `deepgram/nova-3`, `language="multi"`
- LLM: `google/gemma-4-31b-it`
- TTS: `cartesia/sonic-3.6`
- Voice: `CARTESIA_VOICE_ID` environment variable
- Noise enhancement: `ai_coustics` QUAIL_VF_L
- Registered agent name: `AbbieCSR`
- Abbie speaks first when the session starts
- `EndCallTool` handles natural call completion

## Required environment

```env
LIVEKIT_URL=
LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=
CARTESIA_VOICE_ID=
```

The current `inference.*` pipeline does not require direct Deepgram, Gemini, or Cartesia provider API keys. `.env.example` includes optional names for later direct-provider use. Never commit actual secrets.

## Run

```bash
uv sync
uv run src/agent.py dev
```

Production:

```bash
uv run src/agent.py start
```
