# Abbie deployment

## Vercel: web application + HTTP APIs

Import this repository into Vercel. The existing Vite/TanStack application builds from the repository root.

Configure the existing application environment variables plus the database variables required by the project. Do **not** expose Ollama credentials with a `VITE_` prefix.

The Ollama keys belong to the voice worker, not the browser bundle:

- `OLLAMA_API_KEY` — primary
- `OLLAMA_API_KEY_2` — secondary/failover
- `OLLAMA_MODEL` — defaults to `gemma4:31b`

## Voice worker

`worker/src/agent.py` is a LiveKit AgentServer worker and must run as a persistent worker runtime (for example LiveKit Agents deployment or an always-on container/VM). It is not launched by a Vercel HTTP Function.

The LLM pool is ordered primary -> secondary. LiveKit's LLM FallbackAdapter moves to the secondary key when the primary provider instance errors, keeps failed instances unhealthy temporarily, probes for recovery, and can return to the primary after it recovers.

### Worker environment

```env
LIVEKIT_URL=
LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=
OLLAMA_API_KEY=
OLLAMA_API_KEY_2=
OLLAMA_MODEL=gemma4:31b
CARTESIA_VOICE_ID=9626c31c-bec5-4cca-baa8-f8ba9e84c8bc
```

Never commit production secret values to this repository.
