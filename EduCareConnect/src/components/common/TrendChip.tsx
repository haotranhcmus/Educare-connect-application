import React from "react";
import { View, StyleSheet } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";

type Trend =
  | "improving"
  | "stable"
  | "declining"
  | "stagnant"
  | "insufficient_data";

interface TrendChipProps {
  trend: Trend;
  size?: "small" | "medium";
}

const TREND_CONFIG: Record<
  Trend,
  { icon: string; label: string; color: string; bg: string }
> = {
  improving: {
    icon: "trending-up",
    label: "Tốt lên",
    color: "#2E7D32",
    bg: "#C8E6C9",
  },
  stable: {
    icon: "trending-neutral",
    label: "Ổn định",
    color: "#1565C0",
    bg: "#BBDEFB",
  },
  declining: {
    icon: "trending-down",
    label: "Giảm",
    color: "#B00020",
    bg: "#FDECEA",
  },
  stagnant: {
    icon: "minus",
    label: "Chững lại",
    color: "#F57F17",
    bg: "#FFF9C4",
  },
  insufficient_data: {
    icon: "help-circle-outline",
    label: "Chưa đủ DL",
    color: "#9E9E9E",
    bg: "#EEEEEE",
  },
};

export function TrendChip({ trend, size = "small" }: TrendChipProps) {
  const config = TREND_CONFIG[trend] || TREND_CONFIG.insufficient_data;
  const iconSize = size === "small" ? 14 : 18;
  const fontSize = size === "small" ? 11 : 13;

  return (
    <View style={[styles.container, { backgroundColor: config.bg }]}>
      <MaterialCommunityIcons
        name={config.icon as any}
        size={iconSize}
        color={config.color}
      />
      <Text style={[styles.label, { color: config.color, fontSize }]}>
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
    alignSelf: "flex-start",
  },
  label: {
    fontWeight: "600",
  },
});