import React, { useEffect, useMemo } from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { PaperProvider } from "react-native-paper";
import {
  SafeAreaProvider,
  SafeAreaInsetsContext,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { StatusBar } from "expo-status-bar";
import * as Notifications from "expo-notifications";
import { theme } from "./src/theme/theme";
import { queryClient } from "./src/api/queryClient";
import { queryPersister } from "./src/api/queryPersister";
import { setOnSessionExpired } from "./src/api/odooClient";
import { useAuthStore } from "./src/store/authStore";
import { AppNavigator, navigationRef } from "./src/navigation/AppNavigator";
import { OfflineBanner } from "./src/components/common/OfflineBanner";
import { OfflineModal } from "./src/components/common/OfflineModal";
import { useOnlineStatus } from "./src/hooks/useOnlineStatus";
import { usePushRegistration } from "./src/hooks/usePushRegistration";
import { useLocalNotificationFallback } from "./src/hooks/useLocalNotificationFallback";
import { notificationHomeTabForRole } from "./src/utils/notificationRouter";
import { logger } from "./src/utils/logger";
import Toast from "react-native-toast-message";

/**
 * Open the NotificationList screen when the user taps a push notification.
 * NotificationList lives in HomeStack (TeacherNavigator / ParentNavigator),
 * so the user lands on the list — back returns to Home.
 */
function navigateFromNotificationData(_data: unknown) {
  if (!navigationRef.isReady()) return;
  const role = useAuthStore.getState().role;
  const tab = notificationHomeTabForRole(role);
  const nav = navigationRef as unknown as {
    navigate: (name: string, params?: object) => void;
  };
  nav.navigate(tab, { screen: "NotificationList" });
}

const ONE_WEEK_MS = 1000 * 60 * 60 * 24 * 7;

// Global push handler — decides what happens when a notification arrives
// while the app is in the FOREGROUND. Without this, foreground notis would
// be silently dropped on iOS.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

function AppContent() {
  const checkSession = useAuthStore((s) => s.checkSession);
  const insets = useSafeAreaInsets();
  const isOnline = useOnlineStatus();
  // Use the recommended hook (replaces deprecated getLastNotificationResponseAsync).
  // Returns the most recent response if the app was opened via noti tap, else null.
  const lastResponse = Notifications.useLastNotificationResponse();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // Register push token whenever uid becomes available (no-op on Expo Go)
  usePushRegistration();
  // On Expo Go: poll list every 10s, fire local noti for new items so
  // the demo gets a real OS banner even though remote push is broken.
  useLocalNotificationFallback();

  useEffect(() => {
    checkSession();
  }, []);

  // Wire the odooClient session-expired hook into authStore.logout so an
  // expired cookie kicks the user back to the Login screen instead of letting
  // the app spam dead RPCs.
  useEffect(() => {
    setOnSessionExpired(() => {
      const { isAuthenticated: stillAuth, logout } = useAuthStore.getState();
      if (!stillAuth) return; // already logged out
      logger.warn("auth", "Forcing logout — Odoo session expired");
      void logout();
    });
    return () => setOnSessionExpired(() => {});
  }, []);

  // Listener: noti arrives while app foreground (banner already shown by handler)
  useEffect(() => {
    const sub = Notifications.addNotificationReceivedListener((noti) => {
      logger.api(
        "push",
        `Received foreground noti: ${noti.request.content.title}`,
        noti.request.content.data,
      );
    });
    return () => sub.remove();
  }, []);

  // Listener: user TAPS a noti while the app is alive (foreground / background)
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;
        logger.nav("push", `User tapped noti`, data);
        navigateFromNotificationData(data);
      },
    );
    return () => sub.remove();
  }, []);

  // Cold start: app opened by tapping a noti while it was killed.
  // `useLastNotificationResponse` returns the response that launched the app.
  // We wait for both: the navigator must be ready AND the user must be
  // authenticated (cold-start before login → defer until after auth check).
  const coldStartHandledRef = React.useRef(false);
  useEffect(() => {
    if (coldStartHandledRef.current) return;
    if (!lastResponse) return;
    if (!isAuthenticated || !navigationRef.isReady()) return;
    coldStartHandledRef.current = true;
    navigateFromNotificationData(
      lastResponse.notification.request.content.data,
    );
  }, [lastResponse, isAuthenticated]);

  const navigatorInsets = useMemo(
    () => (isOnline ? insets : { ...insets, top: 0 }),
    [insets, isOnline],
  );

  return (
    <View style={{ flex: 1 }}>
      <OfflineBanner />
      <SafeAreaInsetsContext.Provider value={navigatorInsets}>
        <View style={{ flex: 1 }}>
          <AppNavigator />
        </View>
      </SafeAreaInsetsContext.Provider>
    </View>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PaperProvider theme={theme}>
          <PersistQueryClientProvider
            client={queryClient}
            persistOptions={{
              persister: queryPersister,
              maxAge: ONE_WEEK_MS,
              // Bumped to v2 to discard pre-whitelist caches that exceeded
              // Android's 2MB CursorWindow row limit.
              buster: "v2",
              dehydrateOptions: {
                // Only persist small, frequently-needed queries. Heavy ones
                // (objective detail, session results, report detail) live in
                // memory only and refetch on cold start — keeps the
                // AsyncStorage row well under Android's 2MB SQLite limit.
                shouldDehydrateQuery: (q) => {
                  const k = q.queryKey as readonly unknown[];
                  const root = String(k[0] ?? "");
                  const sub = String(k[1] ?? "");
                  if (root === "profile") return true;
                  if (root === "students" && sub === "mine") return true;
                  if (root === "sessions" && (sub === "today" || sub === "my"))
                    return true;
                  if (root === "reports" && sub === "pending-count")
                    return true;
                  return false;
                },
              },
            }}
          >
            <StatusBar style="auto" />
            <AppContent />
            <OfflineModal />
            <Toast />
          </PersistQueryClientProvider>
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
