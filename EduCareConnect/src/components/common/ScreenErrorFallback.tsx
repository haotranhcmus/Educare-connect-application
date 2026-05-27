import React from "react";
import { StyleSheet, View } from "react-native";
import { Button, Text, useTheme } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useQueryErrorResetBoundary } from "@tanstack/react-query";

interface Props {
  error: Error;
  /** Reset function from the surrounding ErrorBoundary. */
  reset: () => void;
  /** Optional title shown above the message. */
  title?: string;
}

export function ScreenErrorFallback({ error, reset, title }: Props) {
  const theme = useTheme();
  const queryReset = useQueryErrorResetBoundary();

  const handleRetry = () => {
    queryReset.reset(); // tell react-query failed queries can retry
    reset(); // clear ErrorBoundary state to re-render children
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <MaterialCommunityIcons
        name="alert-circle-outline"
        size={48}
        color={theme.colors.error}
      />
      <Text
        variant="titleMedium"
        style={[styles.title, { color: theme.colors.error }]}
      >
        {title ?? "Đã xảy ra lỗi"}
      </Text>
      <Text
        variant="bodySmall"
        style={[styles.message, { color: theme.colors.onSurfaceVariant }]}
      >
        {error.message || "Không tải được dữ liệu. Vui lòng thử lại."}
      </Text>
      <Button mode="contained" icon="refresh" onPress={handleRetry}>
        Thử lại
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  title: { marginTop: 16, fontWeight: "700", textAlign: "center" },
  message: { marginTop: 8, marginBottom: 24, textAlign: "center" },
});
