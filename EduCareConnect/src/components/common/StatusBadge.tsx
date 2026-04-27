import React from "react";
import { StyleSheet, View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { STATUS_COLORS } from "../../theme/statusColors";

interface StatusBadgeProps {
  status: string;
  size?: "small" | "medium";
  label?: string;
}

export function StatusBadge({
  status,
  size = "small",
  label,
}: StatusBadgeProps) {
  const config = STATUS_COLORS[status];
  const displayLabel = label || config?.label || status;
  const bgColor = config?.backgroundColor || "#EEEEEE";
  const textColor = config?.color || "#424242";

  const isSmall = size === "small";

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: bgColor,
          paddingHorizontal: isSmall ? 8 : 12,
          paddingVertical: isSmall ? 2 : 4,
        },
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: textColor,
            fontSize: isSmall ? 11 : 13,
          },
        ]}
      >
        {displayLabel}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  text: {
    fontWeight: "600",
  },
});
