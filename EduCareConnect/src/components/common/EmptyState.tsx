import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, Button, useTheme } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    onPress: () => void;
  };
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      {icon && (
        <MaterialCommunityIcons
          name={icon as any}
          size={56}
          color={theme.colors.outlineVariant}
          style={styles.icon}
        />
      )}
      <Text
        variant="titleMedium"
        style={{ color: theme.colors.onSurfaceVariant }}
      >
        {title}
      </Text>
      {description && (
        <Text
          variant="bodyMedium"
          style={[styles.description, { color: theme.colors.outline }]}
        >
          {description}
        </Text>
      )}
      {action && (
        <Button mode="outlined" onPress={action.onPress} style={styles.action}>
          {action.label}
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  icon: { marginBottom: 16 },
  description: { marginTop: 8, textAlign: "center" },
  action: { marginTop: 20 },
});