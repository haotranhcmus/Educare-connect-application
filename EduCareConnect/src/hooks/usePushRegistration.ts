import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { useAuthStore } from "@store/authStore";
import { registerPushToken } from "@api/notificationApi";
import { logger } from "@utils/logger";

/**
 * Expo Go (Constants.executionEnvironment === "storeClient") đã bỏ hỗ trợ
 * remote push trên Android từ SDK 53. Trên iOS Expo Go cũng có nhiều hạn chế.
 * Trong môi trường này: ghi warning + skip register, app vẫn chạy bình thường
 * (user xem noti qua list API).
 *
 * Để bật push thật, cần build dev client:
 *   npx expo install expo-dev-client
 *   eas build --profile development --platform android
 *   (hoặc) npx expo run:android
 */
const IS_EXPO_GO =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

/**
 * Push registration lifecycle:
 *   - Wait until user is authenticated.
 *   - Skip on simulator / web / Expo Go (no native push).
 *   - Ask permission (idempotent — Expo caches user's choice).
 *   - Fetch Expo push token.
 *   - POST to backend.
 *   - Only register once per app lifetime per uid (track via ref).
 *
 * Never throws — push is optional. The user can still open the app and
 * pull notifications via the list API even without push registered.
 */
export function usePushRegistration() {
  const uid = useAuthStore((s) => s.uid);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const registeredForUidRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !uid) return;
    if (registeredForUidRef.current === uid) return;
    if (Platform.OS === "web") return;
    if (!Device.isDevice) {
      logger.warn("push", "Skipping push registration on simulator");
      return;
    }
    if (IS_EXPO_GO) {
      logger.warn(
        "push",
        "Skipping push registration — running in Expo Go " +
          "(remote push removed since SDK 53). Build a dev client to enable.",
      );
      // Mark as "handled" so we don't keep retrying every focus event.
      registeredForUidRef.current = uid;
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        // 1. Permission
        const { status: existingStatus } =
          await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== "granted") {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        if (finalStatus !== "granted") {
          logger.warn("push", "Permission denied — skipping registration");
          return;
        }

        // 2. Android needs an explicit channel for heads-up display
        if (Platform.OS === "android") {
          await Notifications.setNotificationChannelAsync("default", {
            name: "Mặc định",
            importance: Notifications.AndroidImportance.DEFAULT,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: "#FF231F7C",
          });
        }

        // 3. Fetch Expo push token. projectId is required on EAS dev builds —
        //    pull from expo-constants if present; harmless if undefined.
        const projectId =
          Constants.expoConfig?.extra?.eas?.projectId ??
          (Constants as any).easConfig?.projectId;
        const tokenResult = await Notifications.getExpoPushTokenAsync(
          projectId ? { projectId } : undefined,
        );
        const expoToken = tokenResult.data;
        if (!expoToken) {
          logger.warn("push", "Empty Expo push token");
          return;
        }

        // 4. POST to backend
        if (cancelled) return;
        const appVersion = Constants.expoConfig?.version ?? "1.0.0";
        const platform = Platform.OS === "ios" ? "ios" : "android";
        const result = await registerPushToken({
          expoToken,
          platform,
          deviceName: Device.deviceName ?? undefined,
          appVersion,
        });
        if (result.ok) {
          registeredForUidRef.current = uid;
          logger.api("push", `Token registered (id=${result.token_id})`);
        } else {
          logger.warn("push", `Register failed: ${result.error ?? "unknown"}`);
        }
      } catch (err: any) {
        // Defensive: even outside Expo Go, push can fail (revoked permission,
        // EAS misconfig, etc). Never block app flow.
        logger.error("push", `Push registration error: ${err?.message ?? err}`);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, uid]);
}
