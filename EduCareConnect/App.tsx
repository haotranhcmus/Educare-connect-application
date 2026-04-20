import React, { useEffect } from "react";
import { PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClientProvider } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import { theme } from "./src/theme/theme";
import { queryClient } from "./src/api/queryClient";
import { useAuthStore } from "./src/store/authStore";
import { AppNavigator } from "./src/navigation/AppNavigator";

export default function App() {
  const checkSession = useAuthStore((s) => s.checkSession);

  useEffect(() => {
    checkSession();
  }, []);

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="auto" />
          <AppNavigator />
        </QueryClientProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}