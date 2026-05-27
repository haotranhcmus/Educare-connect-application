import { callJsonRoute } from "@api/odooClient";

export interface ConversationItem {
  id: number;
  counterpart_id: number;
  counterpart_name: string;
  counterpart_avatar: string | null;
  last_message_preview: string;
  last_message_at: string | null;
  last_message_from_me: boolean;
  unread_count: number;
}

export interface ChatMessage {
  id: number;
  conversation_id: number;
  sender_id: number;
  sender_name: string;
  from_me: boolean;
  content: string;
  is_read: boolean;
  created_at: string;
}

export async function fetchConversations(): Promise<ConversationItem[]> {
  const result = await callJsonRoute<{ items: ConversationItem[] }>(
    "/api/chat/conversations/list",
  );
  return result.items;
}

export async function fetchMessages(
  conversationId: number,
  options?: { limit?: number; offset?: number },
): Promise<ChatMessage[]> {
  const result = await callJsonRoute<{ items: ChatMessage[] }>(
    "/api/chat/messages/list",
    {
      conversation_id: conversationId,
      limit: options?.limit ?? 100,
      offset: options?.offset ?? 0,
    },
  );
  return result.items;
}

export async function sendChatMessage(
  conversationId: number,
  content: string,
): Promise<{ ok: boolean; message?: ChatMessage; error?: string }> {
  return callJsonRoute("/api/chat/messages/send", {
    conversation_id: conversationId,
    content,
  });
}

export async function markConversationRead(
  conversationId: number,
): Promise<{ ok: boolean; marked?: number }> {
  return callJsonRoute("/api/chat/mark-read", {
    conversation_id: conversationId,
  });
}

export async function fetchChatUnreadCount(): Promise<number> {
  const result = await callJsonRoute<{ count: number }>(
    "/api/chat/unread-count",
  );
  return result.count;
}
