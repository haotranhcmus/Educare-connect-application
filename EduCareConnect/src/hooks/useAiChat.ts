import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Constants from "expo-constants";
import { Platform } from "react-native";

import { queryKeys } from "@api/queryKeys";
import {
  fetchAiSession,
  fetchAiMessages,
  sendAiMessage,
  resetAiSession,
  type AiMessage,
  type AiSession,
  type AiSendResult,
} from "@api/aiChatApi";
import { useAuthStore } from "@store/authStore";

/** Resolve the Expo bundle id so the backend can route to a per-app composer. */
function resolveBundleId(): string | undefined {
  const expo = Constants.expoConfig;
  if (!expo) return undefined;
  if (Platform.OS === "ios") {
    return expo.ios?.bundleIdentifier?.toLowerCase();
  }
  if (Platform.OS === "android") {
    return expo.android?.package?.toLowerCase();
  }
  return undefined;
}

export function useAiSession() {
  const uid = useAuthStore((s) => s.uid);
  return useQuery({
    queryKey: queryKeys.ai.session(uid),
    queryFn: () => fetchAiSession(resolveBundleId()),
    enabled: !!uid,
    staleTime: 30 * 60 * 1000, // 30 min — channel id rarely changes
  });
}

export function useAiMessages(channelId: number | undefined) {
  return useQuery({
    queryKey: queryKeys.ai.messages(channelId),
    queryFn: () => fetchAiMessages(channelId as number),
    enabled: !!channelId,
    staleTime: 60 * 1000,
  });
}

function makeErrorAiMessage(errorMsg: string): AiMessage {
  const lower = errorMsg.toLowerCase();
  let friendly: string;
  if (lower.includes("timeout") || lower.includes("timed out")) {
    friendly = "Yêu cầu mất quá lâu và đã hết thời gian chờ. Vui lòng thử lại.";
  } else if (
    lower.includes("network") ||
    lower.includes("fetch") ||
    lower.includes("connect")
  ) {
    friendly = "Mất kết nối mạng. Kiểm tra kết nối internet và thử lại.";
  } else {
    friendly = `Đã xảy ra lỗi: ${errorMsg}`;
  }
  return {
    id: -(Date.now()),
    content: friendly,
    from_ai: true,
    author_name: "AI",
    created_at: new Date().toISOString(),
    is_error: true,
  };
}

export function useSendAiMessage(channelId: number | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => {
      if (!channelId) throw new Error("No AI channel");
      return sendAiMessage(channelId, content);
    },

    // Optimistically insert the user's message immediately so the bubble
    // appears before the server replies.
    onMutate: async (content: string) => {
      if (!channelId) return;
      const tempId = -(Date.now());
      const optimisticMsg: AiMessage = {
        id: tempId,
        content,
        from_ai: false,
        author_name: "Bạn",
        created_at: new Date().toISOString(),
      };
      qc.setQueryData<AiMessage[]>(
        queryKeys.ai.messages(channelId),
        (prev = []) => [...prev, optimisticMsg],
      );
      return { tempId };
    },

    onSuccess: (result, _content, context) => {
      if (!channelId) return;
      qc.setQueryData<AiMessage[]>(
        queryKeys.ai.messages(channelId),
        (prev = []) => {
          // Remove the optimistic placeholder, then append real messages.
          const without = context?.tempId
            ? prev.filter((m) => m.id !== context.tempId)
            : [...prev];
          const next = [...without];
          if (result.user_message) next.push(result.user_message);
          if (result.ok && result.ai_message) {
            next.push(result.ai_message);
          } else if (!result.ok) {
            next.push(
              makeErrorAiMessage(result.error || "AI không thể xử lý yêu cầu."),
            );
          }
          return next;
        },
      );
    },

    onError: (error, _content, context) => {
      if (!channelId) return;
      const msg = error instanceof Error ? error.message : "Lỗi không xác định";
      // Keep the optimistic user message visible; append an AI error bubble.
      qc.setQueryData<AiMessage[]>(
        queryKeys.ai.messages(channelId),
        (prev = []) => [...prev, makeErrorAiMessage(msg)],
      );
    },
  });
}

export function useResetAiSession() {
  const uid = useAuthStore((s) => s.uid);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (channelId: number) => resetAiSession(channelId),
    onSuccess: () => {
      // Drop the cached session + messages — useAiSession will refetch and
      // /api/ai/session will lazily create a brand-new channel.
      qc.removeQueries({ queryKey: queryKeys.ai.session(uid) });
      qc.removeQueries({ queryKey: ["ai", "messages"] });
    },
  });
}

export type { AiMessage, AiSession, AiSendResult };
