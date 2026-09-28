import {
  GoogleGenAI,
  MediaResolution,
  Modality,
  type LiveServerMessage,
  type Session,
} from "@google/genai";

const MODEL = "models/gemini-3.8-live";
const INPUT_RATE = 16000;
const OUTPUT_RATE = 24000;

type LiveCallState = "active" | "closed";
type TranscriptSpeaker = "customer" | "abbie";

type LiveCallOptions = {
  onState?: (state: LiveCallState) => void;
  onTranscript?: (speaker: TranscriptSpeaker, text: string) => void;
  onError?: (message: string) => void;
};

const ABBIE_SYSTEM_INSTRUCTION = `
You are Abbie, the experienced customer service and business solutions representative of ABI Tech.
Speak like a seasoned Filipino CSR: warm, calm, attentive, confident, practical, conversational, and never salesy.
Listen first. Understand the caller's actual business problem before proposing anything.
Ask only useful questions, one at a time. Remember the caller's first name and details during the call.
When you understand the need, explain a practical ABI Tech solution in plain language and make the path forward feel achievable.
Then offer to send a formal proposal for that exact solution. Keep it low-pressure: the client can review it, proceed if it fits, or pass if it does not.
Do not push for payment on the call. Estimates are preliminary; final scope and pricing belong in the proposal.
For new callers, naturally establish identity and relevant KYC details before handling account-specific or sensitive requests.
Keep answers focused and phone-friendly. Use natural contractions, short pauses, occasional restrained fillers, and small self-corrections when appropriate.
Do not sound like a script, telemarketer, or brochure. Do not mention model/provider names or internal implementation.
At the beginning of a connected call say: "Hello, you've reached Abitech Software Solutions. My name is Abbie. How can I help you with your business today?"
`.trim();

function floatTo16BitPcm(input: Float32Array): Int16Array {
  const out = new Int16Array(input.length);
  for (let i = 0; i < input.length; i++) {
    const sample = Math.max(-1, Math.min(1, input[i] ?? 0));
    out[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
  }
  return out;
}

function resample(input: Float32Array, fromRate: number, toRate: number): Float32Array {
  if (fromRate === toRate) return input;
  const ratio = fromRate / toRate;
  const length = Math.max(1, Math.round(input.length / ratio));
  const out = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    const position = i * ratio;
    const left = Math.floor(position);
    const right = Math.min(left + 1, input.length - 1);
    const mix = position - left;
    out[i] = (input[left] ?? 0) * (1 - mix) + (input[right] ?? 0) * mix;
  }
  return out;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const step = 0x8000;
  for (let i = 0; i < bytes.length; i += step) {
    binary += String.fromCharCode(...bytes.subarray(i, i + step));
  }
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export class GeminiLiveCall {
  private session?: Session;
  private stream?: MediaStream;
  private inputContext?: AudioContext;
  private outputContext?: AudioContext;
  private source?: MediaStreamAudioSourceNode;
  private processor?: ScriptProcessorNode;
  private silentGain?: GainNode;
  private muted = false;
  private speakerEnabled = true;
  private nextPlaybackTime = 0;
  private playing = new Set<AudioBufferSourceNode>();
  private stopped = false;

  constructor(private readonly options: LiveCallOptions = {}) {}

  async start() {
    this.stopped = false;
    const tokenResponse = await fetch("/api/gemini-live-token", { method: "POST" });
    const tokenData = await tokenResponse.json() as { token?: string; error?: string };
    if (!tokenResponse.ok || !tokenData.token) {
      throw new Error(tokenData.error || "Could not create a secure live audio session.");
    }

    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 },
      video: false,
    });

    this.outputContext = new AudioContext({ sampleRate: OUTPUT_RATE });
    await this.outputContext.resume();

    const ai = new GoogleGenAI({ apiKey: tokenData.token, apiVersion: "v1beta" });
    this.session = await ai.live.connect({
      model: MODEL,
      callbacks: {
        onopen: () => this.options.onState?.("active"),
        onmessage: (message: LiveServerMessage) => this.handleMessage(message),
        onerror: (event: ErrorEvent) => this.fail(event.message || "Live audio connection error."),
        onclose: () => {
          if (!this.stopped) this.options.onState?.("closed");
        },
      },
      config: {
        responseModalities: [Modality.AUDIO],
        mediaResolution: MediaResolution.MEDIA_RESOLUTION_MEDIUM,
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } } },
        inputAudioTranscription: {},
        outputAudioTranscription: {},
        contextWindowCompression: {
          triggerTokens: "104857",
          slidingWindow: { targetTokens: "52428" },
        },
        tools: [{ googleSearch: {} }],
        systemInstruction: ABBIE_SYSTEM_INSTRUCTION,
      },
    });

    await this.startMicrophone();
    this.session.sendClientContent({
      turns: [{
        role: "user",
        parts: [{ text: "The call is now connected. Give only your normal inbound greeting and wait for the caller." }],
      }],
      turnComplete: true,
    });
  }

  setMuted(value: boolean) { this.muted = value; }

  setSpeakerEnabled(value: boolean) {
    this.speakerEnabled = value;
    if (!value) this.clearPlayback();
  }

  async stop() {
    this.stopped = true;
    this.clearPlayback();
    try { this.session?.sendRealtimeInput({ audioStreamEnd: true }); } catch {}
    this.session?.close();
    this.session = undefined;
    this.processor?.disconnect();
    this.source?.disconnect();
    this.silentGain?.disconnect();
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = undefined;
    if (this.inputContext && this.inputContext.state !== "closed") await this.inputContext.close();
    if (this.outputContext && this.outputContext.state !== "closed") await this.outputContext.close();
    this.options.onState?.("closed");
  }

  private async startMicrophone() {
    if (!this.stream || !this.session) return;
    this.inputContext = new AudioContext();
    await this.inputContext.resume();
    this.source = this.inputContext.createMediaStreamSource(this.stream);
    this.processor = this.inputContext.createScriptProcessor(2048, 1, 1);
    this.silentGain = this.inputContext.createGain();
    this.silentGain.gain.value = 0;

    this.processor.onaudioprocess = (event) => {
      if (this.muted || !this.session) return;
      const mono = event.inputBuffer.getChannelData(0);
      const pcm = floatTo16BitPcm(resample(mono, this.inputContext!.sampleRate, INPUT_RATE));
      const bytes = new Uint8Array(pcm.buffer, pcm.byteOffset, pcm.byteLength);
      this.session.sendRealtimeInput({
        audio: { data: bytesToBase64(bytes), mimeType: "audio/pcm;rate=16000" },
      });
    };

    this.source.connect(this.processor);
    this.processor.connect(this.silentGain);
    this.silentGain.connect(this.inputContext.destination);
  }

  private handleMessage(message: LiveServerMessage) {
    const content = message.serverContent;
    if (!content) return;

    if (content.interrupted) this.clearPlayback();

    const inputText = content.inputTranscription?.text?.trim();
    if (inputText) this.options.onTranscript?.("customer", inputText);

    const outputText = content.outputTranscription?.text?.trim();
    if (outputText) this.options.onTranscript?.("abbie", outputText);

    for (const part of content.modelTurn?.parts ?? []) {
      const inline = part.inlineData;
      if (inline?.data && inline.mimeType?.startsWith("audio/")) {
        this.playPcm(inline.data);
      }
    }
  }

  private playPcm(base64: string) {
    if (!this.outputContext || !this.speakerEnabled) return;
    const bytes = base64ToBytes(base64);
    const evenLength = bytes.byteLength - (bytes.byteLength % 2);
    if (!evenLength) return;
    const samples = new Int16Array(bytes.buffer, bytes.byteOffset, evenLength / 2);
    const floats = new Float32Array(samples.length);
    for (let i = 0; i < samples.length; i++) floats[i] = (samples[i] ?? 0) / 32768;

    const buffer = this.outputContext.createBuffer(1, floats.length, OUTPUT_RATE);
    buffer.copyToChannel(floats, 0);
    const node = this.outputContext.createBufferSource();
    node.buffer = buffer;
    node.connect(this.outputContext.destination);
    const startAt = Math.max(this.outputContext.currentTime + 0.02, this.nextPlaybackTime);
    node.start(startAt);
    this.nextPlaybackTime = startAt + buffer.duration;
    this.playing.add(node);
    node.onended = () => this.playing.delete(node);
  }

  private clearPlayback() {
    for (const node of this.playing) {
      try { node.stop(); } catch {}
    }
    this.playing.clear();
    this.nextPlaybackTime = this.outputContext?.currentTime ?? 0;
  }

  private fail(message: string) {
    this.options.onError?.(message);
  }
}
