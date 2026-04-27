import React from "react";
import { View, StyleSheet } from "react-native";
import { Button, Text, useTheme } from "react-native-paper";
import { useAuthStore } from "../store/authStore";

export function PlaceholderScreen({ route }: any) {
  const theme = useTheme();
  const { logout } = useAuthStore();
  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Text
        variant="bodyLarge"
        style={{ color: theme.colors.onSurfaceVariant }}
      >
        🚧 {route?.name || "Screen"} — Coming Soon
      </Text>
      <Button mode="text" onPress={logout} style={{ marginTop: 16 }}>
        Đăng xuất
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
});
