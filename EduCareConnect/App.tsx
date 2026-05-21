import React, { useEffect, useMemo } from "react";
import { View } from "react-native";
import { PaperProvider } from "react-native-paper";
import {
  SafeAreaProvider,
  SafeAreaInsetsContext,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { StatusBar } from "expo-status-bar";
import { theme } from "./src/theme/theme";
import { queryClient } from "./src/api/queryClient";
import { queryPersister } from "./src/api/queryPersister";
import { useAuthStore } from "./src/store/authStore";
import { AppNavigator } from "./src/navigation/AppNavigator";
import { OfflineBanner } from "./src/components/common/OfflineBanner";
import { useOnlineStatus } from "./src/hooks/useOnlineStatus";
import Toast from "react-native-toast-message";

const ONE_WEEK_MS = 1000 * 60 * 60 * 24 * 7;

// Separated so it can call hooks that require SafeAreaProvider to be mounted.
function AppContent() {
  const checkSession = useAuthStore((s) => s.checkSession);
  const insets = useSafeAreaInsets();
  const isOnline = useOnlineStatus();

  useEffect(() => {
    checkSession();
  }, []);

  // When offline, OfflineBanner (above) consumes the status-bar inset via its
  // own SafeAreaView. Override the context for AppNavigator so every consumer
  // inside (both React Navigation native headers and custom headers using
  // useSafeAreaInsets) sees top = 0 and doesn't double-count the inset.
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
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{
            persister: queryPersister,
            maxAge: ONE_WEEK_MS,
            buster: "v1", // bump when query data shape changes
          }}
        >
          <StatusBar style="auto" />
          <AppContent />
          <Toast />
        </PersistQueryClientProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
