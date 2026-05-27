import { callJsonRoute } from "@api/odooClient";

export interface AiSession {
  ok: boolean;
  channel_id?: number;
  agent_id?: number;
  agent_name?: string;
  agent_avatar?: string | null;
  error?: string;
}

export interface AiMessage {
  id: number;
  content: string;
  from_ai: boolean;
  author_name: string;
  created_at: string;
  /** Set to true on synthetic error messages injected client-side. */
  is_error?: boolean;
}

export interface AiSendResult {
  ok: boolean;
  error?: string;
  user_message?: AiMessage;
  ai_message?: AiMessage | null;
}

export async function fetchAiSession(bundleId?: string): Promise<AiSession> {
  return callJsonRoute<AiSession>("/api/ai/session", {
    bundle_id: bundleId,
  });
}

export async function fetchAiMessages(channelId: number): Promise<AiMessage[]> {
  const res = await callJsonRoute<{ items: AiMessage[] }>("/api/ai/messages", {
    channel_id: channelId,
  });
  return res.items ?? [];
}

export async function sendAiMessage(
  channelId: number,
  content: string,
): Promise<AiSendResult> {
  return callJsonRoute<AiSendResult>("/api/ai/send", {
    channel_id: channelId,
    content,
  });
}

export async function resetAiSession(
  channelId: number,
): Promise<{ ok: boolean; error?: string }> {
  return callJsonRoute("/api/ai/reset", { channel_id: channelId });
}
