import React from "react";
import { View, StyleSheet, Modal } from "react-native";
import { ActivityIndicator, Text, useTheme } from "react-native-paper";

interface LoadingOverlayProps {
  visible: boolean;
  text?: string;
}

export function LoadingOverlay({
  visible,
  text = "Đang tải...",
}: LoadingOverlayProps) {
  const theme = useTheme();

  if (!visible) return null;

  return (
    <Modal transparent visible={visible}>
      <View style={styles.overlay}>
        <View style={[styles.box, { backgroundColor: theme.colors.surface }]}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text
            variant="bodyMedium"
            style={[styles.text, { color: theme.colors.onSurface }]}
          >
            {text}
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  box: {
    padding: 24,
    borderRadius: 12,
    alignItems: "center",
    minWidth: 140,
    elevation: 4,
  },
  text: {
    marginTop: 16,
  },
});