import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StatusBadge } from "../common/StatusBadge";
import { ProgressBar } from "../common/ProgressBar";
import { ObjectiveCard } from "./ObjectiveCard";
import { useObjectivesForGoal } from "../../hooks/useIep";
import type { IepGoal } from "../../types";

interface GoalCardProps {
  goal: IepGoal;
  expanded?: boolean;
  onToggle?: () => void;
  onObjectivePress?: (objectiveId: number) => void;
  viewMode?: "teacher" | "parent";
}

export function GoalCard({
  goal,
  expanded = false,
  onToggle,
  onObjectivePress,
  viewMode = "teacher",
}: GoalCardProps) {
  const theme = useTheme();
  const { data: objectives = [] } = useObjectivesForGoal(
    expanded ? goal.id : 0,
  );
  const domainName = Array.isArray(goal.goal_domain_id)
    ? goal.goal_domain_id[1]
    : "";

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <TouchableOpacity onPress={onToggle} activeOpacity={0.7}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text variant="labelMedium" style={{ color: theme.colors.primary }}>
              [{goal.goal_code}]
            </Text>
            <Text
              variant="labelMedium"
              style={{ color: theme.colors.onSurfaceVariant, marginLeft: 4 }}
            >
              {domainName}
            </Text>
          </View>
          <StatusBadge status={goal.status} />
        </View>

        <Text
          variant="bodyMedium"
          numberOfLines={expanded ? undefined : 2}
          style={{ marginVertical: 4 }}
        >
          {goal.name}
        </Text>

        {/* Progress */}
        <ProgressBar
          progress={goal.progress_pct || 0}
          label="Tiến độ"
          size="small"
        />

        {/* Expanded metrics */}
        {expanded && (
          <View style={styles.metrics}>
            <Text
              variant="bodySmall"
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              Hiệu suất hiện tại: {Math.round(goal.current_accuracy_pct || 0)}%
            </Text>
            <Text
              variant="bodySmall"
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              Tổng số buổi: {goal.total_sessions || 0}
            </Text>
          </View>
        )}

        {/* Toggle row */}
        <View style={styles.toggleRow}>
          <Text variant="labelSmall" style={{ color: theme.colors.outline }}>
            {goal.objective_count || 0} mục tiêu ngắn hạn
          </Text>
          <View style={styles.toggleBtn}>
            <Text variant="labelSmall" style={{ color: theme.colors.primary }}>
              {expanded ? "Thu gọn" : "Mở rộng"}
            </Text>
            <MaterialCommunityIcons
              name={expanded ? "chevron-up" : "chevron-down"}
              size={18}
              color={theme.colors.primary}
            />
          </View>
        </View>
      </TouchableOpacity>

      {/* Expanded Objectives */}
      {expanded && objectives.length > 0 && (
        <View style={styles.objectives}>
          <Text
            variant="labelMedium"
            style={[styles.objHeader, { color: theme.colors.onSurfaceVariant }]}
          >
            Mục tiêu ngắn hạn
          </Text>
          {objectives.map((obj) => (
            <ObjectiveCard
              key={obj.id}
              objective={obj}
              onPress={onObjectivePress}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 12, borderRadius: 12, marginBottom: 8, elevation: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: { flexDirection: "row", alignItems: "center" },
  metrics: { marginTop: 8, gap: 2 },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  toggleBtn: { flexDirection: "row", alignItems: "center" },
  objectives: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    paddingTop: 8,
  },
  objHeader: { marginBottom: 8, fontWeight: "600" },
});
