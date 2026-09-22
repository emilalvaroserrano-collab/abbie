export type WaLinkStatus = "idle" | "qr" | "connecting" | "connected" | "error";

export type WaStatus = {
  status: WaLinkStatus;
  qrDataUrl: string | null;
  pairingCode: string | null;
  userName: string | null;
  userPhone: string | null;
  error: string | null;
  saved: boolean;
};
