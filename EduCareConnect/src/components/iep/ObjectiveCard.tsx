import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StatusBadge } from "../common/StatusBadge";
import { ProgressBar } from "../common/ProgressBar";
import { TrendChip } from "../common/TrendChip";
import type { IepObjectiveListItem } from "../../types";
import { formatDate } from "../../utils/formatters";

interface ObjectiveCardProps {
  objective: IepObjectiveListItem;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: (id: number) => void;
  onPress?: (id: number) => void;
}

export function ObjectiveCard({
  objective,
  selectable = false,
  selected = false,
  onSelect,
  onPress,
}: ObjectiveCardProps) {
  const theme = useTheme();

  const handlePress = () => {
    if (selectable && onSelect) {
      onSelect(objective.id);
    } else if (onPress) {
      onPress(objective.id);
    }
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.background,
            borderColor: selected
              ? theme.colors.primary
              : theme.colors.outlineVariant,
            borderWidth: selectable ? 1.5 : 0,
          },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {selectable && (
              <MaterialCommunityIcons
                name={selected ? "checkbox-marked" : "checkbox-blank-outline"}
                size={20}
                color={selected ? theme.colors.primary : theme.colors.outline}
                style={{ marginRight: 8 }}
              />
            )}
            <Text variant="labelMedium" style={{ color: theme.colors.primary }}>
              {objective.objective_code}:
            </Text>
          </View>
          <StatusBadge status={objective.status} size="small" />
        </View>

        <Text
          variant="bodySmall"
          numberOfLines={2}
          style={{ marginVertical: 4 }}
        >
          {objective.name}
        </Text>

        {/* Accuracy row */}
        <View style={styles.accuracyRow}>
          <Text variant="labelSmall" style={{ color: theme.colors.outline }}>
            Baseline: {objective.baseline_accuracy_pct}%
          </Text>
          <Text
            variant="labelSmall"
            style={{ color: theme.colors.onSurface, fontWeight: "600" }}
          >
            Hiện tại: {Math.round(objective.current_accuracy_pct || 0)}%
          </Text>
          <Text variant="labelSmall" style={{ color: theme.colors.outline }}>
            Mục tiêu: {objective.target_accuracy_pct}%
          </Text>
        </View>

        {/* Progress + Trend */}
        <View style={{ marginTop: 4 }}>
          <ProgressBar
            progress={objective.progress_pct || 0}
            baseline={objective.baseline_accuracy_pct}
            target={objective.target_accuracy_pct}
            size="small"
          />
        </View>

        <View style={styles.footer}>
          {objective.trend && (
            <TrendChip trend={objective.trend} size="small" />
          )}
          {objective.last_session_date && (
            <Text variant="labelSmall" style={{ color: theme.colors.outline }}>
              Gần nhất: {formatDate(objective.last_session_date)}
            </Text>
          )}
          {!selectable && (
            <MaterialCommunityIcons
              name="chevron-right"
              size={18}
              color={theme.colors.outline}
            />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { padding: 10, borderRadius: 10, marginBottom: 8 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: { flexDirection: "row", alignItems: "center" },
  accuracyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
});
