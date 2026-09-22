type ListenHandlers = {
  onInterim: (text: string) => void;
  onFinal: (text: string) => void;
  onError: (error: string) => void;
  onEnd: () => void;
};

type Rec = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((ev: { results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null;
  onerror: ((ev: { error: string }) => void) | null;
  onend: (() => void) | null;
};

function RecognitionCtor(): (new () => Rec) | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & {
    SpeechRecognition?: new () => Rec;
    webkitSpeechRecognition?: new () => Rec;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export function canUseBrowserSpeech() {
  return RecognitionCtor() !== null;
}

export function startBrowserListen(handlers: ListenHandlers): { stop: () => void } {
  const Ctor = RecognitionCtor();
  if (!Ctor) {
    handlers.onError("Voice input is not supported in this browser.");
    handlers.onEnd();
    return { stop: () => {} };
  }
  const rec = new Ctor();
  rec.lang = "en-US";
  rec.continuous = false;
  rec.interimResults = true;
  let stopped = false;
  let finalText = "";

  rec.onresult = (ev) => {
    let interim = "";
    for (let i = 0; i < ev.results.length; i++) {
      const row = ev.results[i];
      if (!row) continue;
      const t = row[0]?.transcript ?? "";
      if (row.isFinal) finalText += t;
      else interim += t;
    }
    if (interim) handlers.onInterim((finalText + " " + interim).trim());
  };
  rec.onerror = (ev) => {
    if (stopped) return;
    if (ev.error === "no-speech") {
      handlers.onEnd();
      return;
    }
    if (ev.error === "aborted") return;
    handlers.onError(
      ev.error === "not-allowed"
        ? "Microphone permission is blocked."
        : "Could not hear that.",
    );
  };
  rec.onend = () => {
    if (stopped) return;
    const text = finalText.trim();
    if (text) handlers.onFinal(text);
    else handlers.onEnd();
  };
  rec.start();
  return {
    stop: () => {
      stopped = true;
      try {
        rec.abort();
      } catch {
        /* ignore */
      }
    },
  };
}

export function playBase64Mp3(b64: string): { el: HTMLAudioElement; done: Promise<void> } {
  const bin = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  const url = URL.createObjectURL(new Blob([bin], { type: "audio/mpeg" }));
  const el = new Audio(url);
  el.preload = "auto";
  const done = new Promise<void>((resolve) => {
    const finish = () => {
      URL.revokeObjectURL(url);
      resolve();
    };
    el.addEventListener("ended", finish, { once: true });
    el.addEventListener("error", finish, { once: true });
  });
  void el.play().catch(() => {
    /* autoplay may require a gesture; call overlay is a gesture */
  });
  return { el, done };
}
