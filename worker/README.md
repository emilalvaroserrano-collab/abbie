# AbbieCSR LiveKit Worker

Voice worker for ABI Tech's Abbie customer-service agent.

## Current voice stack

- STT: `deepgram/nova-3`, `language="multi"`
- LLM: Ollama Cloud via its OpenAI-compatible endpoint (`https://ollama.com/v1`)
- Default Ollama model: `gemma4:31b` (override with `OLLAMA_MODEL`)
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
OLLAMA_API_KEY=
OLLAMA_API_KEY_2=
OLLAMA_MODEL=gemma4:31b
```

STT and TTS continue through LiveKit Inference. The conversation LLM connects directly to Ollama Cloud and requires `OLLAMA_API_KEY` and `OLLAMA_API_KEY_2`. The worker automatically falls back from key 1 to key 2 when the primary request fails, and periodically restores the primary when it becomes healthy again. Keep the key in the deployment environment only; never commit actual secrets.

## Run

```bash
uv sync
uv run src/agent.py dev
```

Production:

```bash
uv run src/agent.py start
```
