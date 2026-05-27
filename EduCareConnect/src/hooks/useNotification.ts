import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@api/queryKeys";
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationsRead,
  type NotificationItem,
} from "@api/notificationApi";
import { useAuthStore } from "@store/authStore";

export function useNotificationList(onlyUnread = false) {
  const uid = useAuthStore((s) => s.uid);
  return useQuery({
    queryKey: queryKeys.notifications.list(uid, onlyUnread),
    queryFn: () => fetchNotifications({ onlyUnread }),
    enabled: !!uid,
    staleTime: 30_000, // 30s — noti list khá ổn định
  });
}

export function useUnreadCount() {
  const uid = useAuthStore((s) => s.uid);
  return useQuery({
    queryKey: queryKeys.notifications.unreadCount(uid),
    queryFn: () => fetchUnreadCount(),
    enabled: !!uid,
    staleTime: 30_000,
    // Poll quietly in the background so the badge stays fresh without user input
    refetchInterval: 60_000,
  });
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { ids?: number[]; all?: boolean }) =>
      markNotificationsRead(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}

export type { NotificationItem };
