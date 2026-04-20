import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, useTheme } from "react-native-paper";

export function PlaceholderScreen({ route }: any) {
  const theme = useTheme();
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
});