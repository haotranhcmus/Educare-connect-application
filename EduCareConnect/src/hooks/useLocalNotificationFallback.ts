import { useEffect, useRef } from "react";
import * as Notifications from "expo-notifications";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@store/authStore";
import { fetchNotifications } from "@api/notificationApi";
import { queryKeys } from "@api/queryKeys";
import { logger } from "@utils/logger";

const IS_EXPO_GO =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
const POLL_INTERVAL_MS = 10_000;
const POLL_LIMIT = 10;

/**
 * Demo fallback for environments where remote push doesn't work
 * (Expo Go on Android since SDK 53).
 *
 * Strategy: poll the notification list every 10s; when new items appear
 * (id > lastSeen), fire LOCAL notifications via scheduleNotificationAsync.
 * Local notifications still work on Expo Go, so the user gets a real OS
 * banner — visually indistinguishable from a real remote push.
 *
 * Also invalidates the unread-count cache so the tab badge refreshes
 * immediately instead of waiting for its own 60s poll.
 *
 * Limitations:
 *   - Only runs while JS thread is alive (foreground / short background).
 *     If the app is fully killed, no notifications fire until next open.
 *   - First poll establishes the high-water mark — backlog items don't fire.
 *   - Disabled on dev/standalone builds (real push handles it natively).
 */
export function useLocalNotificationFallback() {
  const uid = useAuthStore((s) => s.uid);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const qc = useQueryClient();
  const lastSeenIdRef = useRef<number>(0);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || !uid) return;
    if (!IS_EXPO_GO) return;

    // Reset state when the user changes (logout/login as someone else).
    lastSeenIdRef.current = 0;
    initializedRef.current = false;

    let cancelled = false;

    async function poll() {
      try {
        const items = await fetchNotifications({ limit: POLL_LIMIT });
        if (cancelled || !items?.length) return;

        const maxId = Math.max(...items.map((i) => i.id));

        if (!initializedRef.current) {
          // First poll: record high-water mark, don't fire for past noti.
          lastSeenIdRef.current = maxId;
          initializedRef.current = true;
          return;
        }

        const newItems = items.filter((i) => i.id > lastSeenIdRef.current);
        if (newItems.length === 0) return;

        // Fire local notification for each new item. Reverse so OS stacks
        // them oldest → newest (newest stays on top).
        for (const item of [...newItems].reverse()) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: item.title,
              body: item.body,
              data: {
                notification_id: item.id,
                type: item.type,
                ref_model: item.ref_model ?? "",
                ref_id: item.ref_id ?? 0,
              },
              sound: "default",
            },
            trigger: null, // fire immediately
          });
        }
        lastSeenIdRef.current = maxId;
        // Force the badge to refresh now instead of waiting for its own poll.
        qc.invalidateQueries({
          queryKey: queryKeys.notifications.unreadCount(uid),
        });
        logger.api(
          "push",
          `Fired ${newItems.length} local fallback notification(s)`,
        );
      } catch (err: any) {
        logger.warn(
          "push",
          `Local fallback poll failed: ${err?.message ?? err}`,
        );
      }
    }

    // Kick off immediately, then poll on interval.
    poll();
    const handle = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(handle);
    };
  }, [isAuthenticated, uid, qc]);
}
