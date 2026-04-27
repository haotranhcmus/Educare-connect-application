import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, useTheme, Divider } from "react-native-paper";
import { ProgressBar } from "../common/ProgressBar";
import { TrendChip } from "../common/TrendChip";
import type { IepObjectiveDetail } from "../../types";

interface MetricsCardProps {
  objective: IepObjectiveDetail;
}

export function MetricsCard({ objective }: MetricsCardProps) {
  const theme = useTheme();

  const metrics = [
    {
      label: "Baseline",
      value: `${objective.baseline_accuracy_pct}%`,
      icon: "📊",
    },
    {
      label: "Hiện tại",
      value: `${Math.round(objective.current_accuracy_pct || 0)}%`,
      icon: "📈",
      highlight: true,
    },
    {
      label: "Mục tiêu",
      value: `${objective.target_accuracy_pct}%`,
      icon: "🎯",
    },
  ];

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      {/* Accuracy row */}
      <View style={styles.accuracyRow}>
        {metrics.map((m) => (
          <View key={m.label} style={styles.metricItem}>
            <Text variant="labelSmall" style={{ color: theme.colors.outline }}>
              {m.label}
            </Text>
            <Text
              variant="titleMedium"
              style={[
                { fontWeight: "700" },
                m.highlight ? { color: theme.colors.primary } : {},
              ]}
            >
              {m.value}
            </Text>
          </View>
        ))}
      </View>

      <ProgressBar
        progress={objective.progress_pct || 0}
        baseline={objective.baseline_accuracy_pct}
        target={objective.target_accuracy_pct}
        size="medium"
      />

      <Divider style={{ marginVertical: 8 }} />

      {/* Secondary metrics */}
      <View style={styles.secondaryRow}>
        <View style={styles.secondaryItem}>
          <Text variant="labelSmall" style={{ color: theme.colors.outline }}>
            Xu hướng
          </Text>
          {objective.trend ? (
            <TrendChip trend={objective.trend} />
          ) : (
            <Text variant="bodySmall">—</Text>
          )}
        </View>
        <View style={styles.secondaryItem}>
          <Text variant="labelSmall" style={{ color: theme.colors.outline }}>
            Tổng buổi
          </Text>
          <Text variant="bodyMedium" style={{ fontWeight: "600" }}>
            {objective.total_sessions_worked || 0}
          </Text>
        </View>
        <View style={styles.secondaryItem}>
          <Text variant="labelSmall" style={{ color: theme.colors.outline }}>
            Buổi liên tiếp đạt
          </Text>
          <Text variant="bodyMedium" style={{ fontWeight: "600" }}>
            {objective.consecutive_sessions_achieved || 0}/
            {objective.consecutive_sessions_required || 3}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16, borderRadius: 12, elevation: 1 },
  accuracyRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 12,
  },
  metricItem: { alignItems: "center" },
  secondaryRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 8,
  },
  secondaryItem: { alignItems: "center", gap: 4 },
});
