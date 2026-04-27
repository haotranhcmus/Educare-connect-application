import React, { useState } from "react";
import { ScrollView, View, TouchableOpacity, StyleSheet } from "react-native";
import { Text, ProgressBar, Divider, useTheme } from "react-native-paper";
import { LoadingOverlay } from "../../../components/common/LoadingOverlay";
import { StatusBadge } from "../../../components/common/StatusBadge";
import {
  useActiveIepPlan,
  useGoalsWithObjectives,
} from "../../../hooks/useParent";

interface ChildProgressTabProps {
  studentId: number;
}

const TREND_MAP: Record<string, { icon: string; label: string }> = {
  improving: { icon: "↑", label: "Tốt hơn" },
  stable: { icon: "→", label: "Ổn định" },
  declining: { icon: "↓", label: "Cần cải thiện" },
  stagnant: { icon: "⟳", label: "Chưa thay đổi" },
  insufficient_data: { icon: "—", label: "Chưa đủ dữ liệu" },
};

function getAccuracyBadge(current: number, target: number, status: string) {
  if (status === "mastered") return { icon: "⭐", color: "#F57C00" };
  if (current >= target) return { icon: "✅", color: "#2E7D32" };
  if (current >= 50) return { icon: "🔵", color: "#1976D2" };
  return { icon: "🟡", color: "#F9A825" };
}

export function ChildProgressTab({ studentId }: ChildProgressTabProps) {
  const theme = useTheme();
  const { data: activePlan, isLoading: loadingPlan } =
    useActiveIepPlan(studentId);
  const { data: goals = [], isLoading: loadingGoals } = useGoalsWithObjectives(
    activePlan?.id,
  );
  const [expandedGoals, setExpandedGoals] = useState<Set<number>>(new Set());

  const toggleGoal = (goalId: number) => {
    setExpandedGoals((prev) => {
      const next = new Set(prev);
      next.has(goalId) ? next.delete(goalId) : next.add(goalId);
      return next;
    });
  };

  if (loadingPlan || loadingGoals) return <LoadingOverlay visible />;
  if (!activePlan) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 24,
        }}
      >
        <Text variant="bodyLarge">Chưa có kế hoạch IEP nào đang hoạt động</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Plan header */}
      <Text variant="titleSmall" style={{ fontWeight: "700" }}>
        Kế hoạch IEP: {activePlan.iep_period}
      </Text>
      <Text variant="bodySmall" style={{ color: "#757575" }}>
        {activePlan.start_date} → {activePlan.end_date} · 🟢 Active
      </Text>

      <Divider style={{ marginVertical: 16 }} />

      {/* Goal cards */}
      {goals.map((goal: any) => {
        const isExpanded = expandedGoals.has(goal.id);
        const domainName = Array.isArray(goal.goal_domain_id)
          ? goal.goal_domain_id[1]
          : "";

        return (
          <TouchableOpacity
            key={goal.id}
            style={[styles.goalCard, { backgroundColor: theme.colors.surface }]}
            onPress={() => toggleGoal(goal.id)}
            activeOpacity={0.8}
          >
            <Text variant="titleSmall">{domainName}</Text>
            <Text
              variant="bodyMedium"
              numberOfLines={isExpanded ? undefined : 1}
            >
              {goal.name}
            </Text>

            {/* Progress bar */}
            <View style={{ marginTop: 8 }}>
              <Text variant="bodySmall">Tiến độ tổng thể</Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginTop: 4,
                }}
              >
                <ProgressBar
                  progress={(goal.progress_pct || 0) / 100}
                  color={theme.colors.primary}
                  style={{ flex: 1, height: 8, borderRadius: 4 }}
                />
                <Text variant="bodySmall" style={{ marginLeft: 8 }}>
                  {Math.round(goal.progress_pct || 0)}%
                </Text>
              </View>
            </View>

            {/* Expand indicator */}
            <Text
              variant="bodySmall"
              style={{ textAlign: "right", marginTop: 4, opacity: 0.5 }}
            >
              {isExpanded
                ? "⌃"
                : `⌄ ${goal.objective_count || 0} mục tiêu ngắn hạn`}
            </Text>

            {/* Expanded objectives */}
            {isExpanded && goal.objectives && (
              <View style={{ marginTop: 12 }}>
                <Text
                  variant="bodySmall"
                  style={{ fontWeight: "600", marginBottom: 8 }}
                >
                  Các mục tiêu ngắn hạn
                </Text>
                {goal.objectives.map((obj: any) => {
                  const badge = getAccuracyBadge(
                    obj.current_accuracy_pct,
                    obj.target_accuracy_pct,
                    obj.status,
                  );
                  const trend =
                    TREND_MAP[obj.trend] || TREND_MAP.insufficient_data;

                  return (
                    <View key={obj.id} style={styles.objectiveBlock}>
                      <Text variant="bodyMedium" style={{ fontWeight: "600" }}>
                        {obj.name}
                      </Text>

                      <View style={styles.accuracyRow}>
                        <Text variant="bodySmall">
                          Xuất phát: {obj.baseline_accuracy_pct}%
                        </Text>
                        <Text variant="bodySmall">
                          Hiện tại: {obj.current_accuracy_pct}% Mục tiêu:{" "}
                          {obj.target_accuracy_pct}%
                        </Text>
                      </View>

                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          marginTop: 4,
                        }}
                      >
                        <ProgressBar
                          progress={
                            obj.target_accuracy_pct > 0
                              ? obj.current_accuracy_pct /
                                obj.target_accuracy_pct
                              : 0
                          }
                          color={badge.color}
                          style={{ flex: 1, height: 6, borderRadius: 3 }}
                        />
                        <Text variant="bodySmall" style={{ marginLeft: 8 }}>
                          {obj.current_accuracy_pct}/{obj.target_accuracy_pct}
                        </Text>
                      </View>

                      <Text variant="bodySmall" style={{ marginTop: 4 }}>
                        {badge.icon} Đang thực hiện {trend.icon} {trend.label}
                      </Text>

                      {obj.last_session_date && (
                        <Text
                          variant="bodySmall"
                          style={{ color: "#757575", marginTop: 2 }}
                        >
                          Buổi gần nhất: {obj.last_session_date}
                          {obj.last_session_accuracy
                            ? ` · ${obj.last_session_accuracy}%`
                            : ""}
                        </Text>
                      )}

                      <Divider style={{ marginTop: 8 }} />
                    </View>
                  );
                })}
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  goalCard: { padding: 16, borderRadius: 12, marginBottom: 12, elevation: 1 },
  objectiveBlock: { marginBottom: 12 },
  accuracyRow: { marginTop: 4 },
});
