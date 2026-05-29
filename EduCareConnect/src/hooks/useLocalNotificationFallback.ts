import { useEffect, useRef } from "react";
import * as Notifications from "expo-notifications";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { onlineManager, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@store/authStore";
import { fetchNotifications } from "@api/notificationApi";
import { queryKeys } from "@api/queryKeys";
import { logger } from "@utils/logger";

const IS_EXPO_GO =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
const POLL_INTERVAL_MS = 10_000;
// After this many back-to-back failures the poller slows to BACKOFF_INTERVAL_MS
// to stop spamming the log when the network or backend is genuinely down.
const FAILURE_THRESHOLD = 3;
const BACKOFF_INTERVAL_MS = 60_000;
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
    let consecutiveFailures = 0;
    let currentInterval = POLL_INTERVAL_MS;
    let handle: ReturnType<typeof setTimeout>;

    function schedule() {
      if (cancelled) return;
      handle = setTimeout(poll, currentInterval);
    }

    async function poll() {
      // Skip cleanly when offline — react-query's onlineManager is the single
      // source of truth (driven by NetInfo). Don't burn a request that will
      // just throw ERR_NETWORK and bloat the log.
      if (!onlineManager.isOnline()) {
        schedule();
        return;
      }
      try {
        const items = await fetchNotifications({ limit: POLL_LIMIT });
        consecutiveFailures = 0;
        currentInterval = POLL_INTERVAL_MS;
        if (cancelled || !items?.length) {
          schedule();
          return;
        }

        const maxId = Math.max(...items.map((i) => i.id));

        if (!initializedRef.current) {
          // First poll: record high-water mark, don't fire for past noti.
          lastSeenIdRef.current = maxId;
          initializedRef.current = true;
          schedule();
          return;
        }

        const newItems = items.filter((i) => i.id > lastSeenIdRef.current);
        if (newItems.length === 0) {
          schedule();
          return;
        }

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
        schedule();
      } catch (err: any) {
        consecutiveFailures += 1;
        // Only log the first failure at WARN. After that we're in a known
        // failure mode (network down / backend down) — keep it quiet.
        if (consecutiveFailures <= FAILURE_THRESHOLD) {
          logger.warn(
            "push",
            `Local fallback poll failed (${consecutiveFailures}): ${err?.message ?? err}`,
          );
        }
        if (consecutiveFailures >= FAILURE_THRESHOLD) {
          currentInterval = BACKOFF_INTERVAL_MS;
        }
        schedule();
      }
    }

    // Kick off immediately; each successful or failed poll schedules its own
    // follow-up so the interval can adapt to network state.
    poll();

    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [isAuthenticated, uid, qc]);
}
