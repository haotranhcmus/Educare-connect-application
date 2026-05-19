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

function GoalCardImpl({
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
    <View>
      <Text
        variant="labelLarge"
        style={{
          color: theme.colors.onSurfaceVariant,
          marginLeft: 4,
          fontWeight: "700",
        }}
      >
        {domainName}
      </Text>
      <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <TouchableOpacity onPress={onToggle} activeOpacity={0.7}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text
                variant="labelSmall"
                style={{ color: theme.colors.outline }}
              >
                [{goal.goal_code}]
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
          <View
            style={{
              flexDirection: "row",
              justifyContent: "flex-end",
              marginBottom: 2,
            }}
          >
            <Text
              variant="labelSmall"
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              {Math.round(goal.progress_pct || 0)}%
            </Text>
          </View>
          <ProgressBar
            progress={goal.progress_pct || 0}
            label=""
            size="small"
          />

          {/* Expanded metrics */}
          {expanded && (
            <View style={styles.metrics}>
              <Text
                variant="bodySmall"
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                {goal.total_sessions || 0} buổi đã học
              </Text>
            </View>
          )}

          {/* Toggle row */}
          <View style={styles.toggleRow}>
            <Text variant="labelSmall" style={{ color: theme.colors.outline }}>
              {expanded ? "" : `${goal.objective_count || 0} mục tiêu ngắn hạn`}
            </Text>
            <View style={styles.toggleBtn}>
              <Text
                variant="labelSmall"
                style={{ color: theme.colors.primary }}
              >
                {expanded ? "Ẩn mục tiêu ngắn hạn" : "Xem mục tiêu ngắn hạn"}
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
              style={[
                styles.objHeader,
                { color: theme.colors.onSurfaceVariant },
              ]}
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
    </View>
  );
}

export const GoalCard = React.memo(GoalCardImpl);

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
