export const AUTH_CHANNEL_NAME = "notemap-auth";

export type AuthBroadcastMessage =
  | { type: "LOGOUT" }
  | { type: "LOGIN" }
  | { type: "SESSION_REFRESH" };

export function broadcastAuth(message: AuthBroadcastMessage) {
  if (typeof window === "undefined") return;
  if (!("BroadcastChannel" in window)) return;

  const channel = new BroadcastChannel(AUTH_CHANNEL_NAME);
  channel.postMessage(message);
  channel.close();
}
