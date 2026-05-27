import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@api/queryKeys";
import {
  fetchConversations,
  fetchMessages,
  fetchChatUnreadCount,
  sendChatMessage,
  markConversationRead,
  type ChatMessage,
  type ConversationItem,
} from "@api/chatApi";
import { useAuthStore } from "@store/authStore";

/** Conversations list. Polled every 8s so previews + unread counts stay fresh. */
export function useConversations() {
  const uid = useAuthStore((s) => s.uid);
  return useQuery({
    queryKey: queryKeys.chat.conversations(uid),
    queryFn: fetchConversations,
    enabled: !!uid,
    staleTime: 5_000,
    refetchInterval: 8_000,
  });
}

/** Messages of one conversation. Polled every 3s while screen is mounted. */
export function useMessages(conversationId: number | undefined) {
  return useQuery({
    queryKey: queryKeys.chat.messages(conversationId),
    queryFn: () => fetchMessages(conversationId as number),
    enabled: !!conversationId,
    staleTime: 1_000,
    refetchInterval: 3_000,
  });
}

/** Total unread messages — used for the Chat tab badge. */
export function useChatUnreadCount() {
  const uid = useAuthStore((s) => s.uid);
  return useQuery({
    queryKey: queryKeys.chat.unreadCount(uid),
    queryFn: fetchChatUnreadCount,
    enabled: !!uid,
    staleTime: 5_000,
    refetchInterval: 8_000,
  });
}

export function useSendMessage(conversationId: number | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => {
      if (!conversationId) throw new Error("No conversation");
      return sendChatMessage(conversationId, content);
    },
    onSuccess: () => {
      // Instant refresh — don't wait for the 3s poll.
      qc.invalidateQueries({
        queryKey: queryKeys.chat.messages(conversationId),
      });
      qc.invalidateQueries({ queryKey: queryKeys.chat.all });
    },
  });
}

export function useMarkConversationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (conversationId: number) =>
      markConversationRead(conversationId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.chat.all });
      // Backend also clears bell notis of type new_chat_message for this
      // conversation, so refresh the notification list + badge count.
      qc.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}

export type { ChatMessage, ConversationItem };
