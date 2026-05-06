import React, { useState } from "react";
import { ScrollView, View, TouchableOpacity, StyleSheet } from "react-native";
import { Text, ProgressBar, Divider, useTheme, Chip } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LoadingOverlay } from "../../../components/common/LoadingOverlay";
import { StatusBadge } from "../../../components/common/StatusBadge";
import {
  useActiveIepPlan,
  useGoalsWithObjectives,
} from "../../../hooks/useParent";
import { theme } from "@/src/theme/theme";

interface ChildProgressTabProps {
  studentId: number;
}

const TREND_MAP: Record<
  string,
  { icon: string; color: string; label: string }
> = {
  improving: { icon: "trending-up", color: "#2E7D32", label: "Tốt hơn" },
  stable: { icon: "minus", color: "#1976D2", label: "Ổn định" },
  declining: {
    icon: "trending-down",
    color: "#B71C1C",
    label: "Cần cải thiện",
  },
  stagnant: { icon: "refresh", color: "#E65100", label: "Chưa thay đổi" },
  insufficient_data: {
    icon: "help-circle-outline",
    color: "#757575",
    label: "Chưa đủ dữ liệu",
  },
};

function getAccuracyBadge(current: number, target: number, status: string) {
  if (status === "mastered") return { icon: "star", color: "#F57C00" };
  if (current >= target) return { icon: "check-circle", color: "#2E7D32" };
  if (current >= 50) return { icon: "trending-up", color: "#1976D2" };
  return { icon: "clock-outline", color: "#F9A825" };
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
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          flexWrap: "wrap",
          marginTop: 2,
        }}
      >
        <Text variant="bodySmall" style={{ color: "#757575" }}>
          {activePlan.start_date} → {activePlan.end_date} ·{" "}
        </Text>
        <MaterialCommunityIcons
          name="circle-medium"
          size={14}
          color="#2E7D32"
        />
        <Text variant="bodySmall" style={{ color: "#2E7D32" }}>
          Hoạt động
        </Text>
      </View>

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
            {/* Domain chip */}
            <View style={styles.goalHeader}>
              <View
                style={[
                  styles.domainChip,
                  { backgroundColor: theme.colors.primaryContainer },
                ]}
              >
                <MaterialCommunityIcons
                  name="bookmark-outline"
                  size={12}
                  color={theme.colors.primary}
                />
                <Text
                  variant="labelSmall"
                  style={{ color: theme.colors.primary, marginLeft: 4 }}
                >
                  {domainName}
                </Text>
              </View>
            </View>

            <Text
              variant="titleSmall"
              style={[styles.goalName, { color: theme.colors.onSurface }]}
              numberOfLines={isExpanded ? undefined : 2}
            >
              {goal.name}
            </Text>

            {/* Progress section */}
            <View style={styles.progressSection}>
              <View style={styles.progressLabelRow}>
                <Text
                  variant="labelSmall"
                  style={{ color: theme.colors.onSurfaceVariant }}
                >
                  Tiến độ tổng thể
                </Text>
                <Text
                  variant="labelMedium"
                  style={{ color: theme.colors.primary, fontWeight: "700" }}
                >
                  {Math.round(goal.progress_pct || 0)}%
                </Text>
              </View>
              <ProgressBar
                progress={(goal.progress_pct || 0) / 100}
                color={theme.colors.primary}
                style={styles.progressBar}
              />
            </View>

            {/* Expand indicator */}
            <View style={styles.expandRow}>
              <Text
                variant="labelSmall"
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                {isExpanded
                  ? "Thu gọn"
                  : `${goal.objective_count || 0} mục tiêu ngắn hạn`}
              </Text>
              <MaterialCommunityIcons
                name={isExpanded ? "chevron-up" : "chevron-down"}
                size={16}
                color={theme.colors.onSurfaceVariant}
              />
            </View>

            {/* Expanded objectives */}
            {isExpanded && goal.objectives && (
              <View style={styles.objectivesContainer}>
                <Divider style={{ marginBottom: 12 }} />
                <Text
                  variant="labelMedium"
                  style={[
                    styles.objectivesHeader,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
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
                  const progressRatio =
                    obj.target_accuracy_pct > 0
                      ? Math.min(
                          obj.current_accuracy_pct / obj.target_accuracy_pct,
                          1,
                        )
                      : 0;

                  return (
                    <View
                      key={obj.id}
                      style={[
                        styles.objectiveCard,
                        { backgroundColor: theme.colors.background },
                      ]}
                    >
                      <Text
                        variant="bodySmall"
                        style={[
                          styles.objectiveName,
                          { color: theme.colors.onSurface },
                        ]}
                      >
                        {obj.name}
                      </Text>

                      {/* Accuracy stats row */}
                      <View style={styles.statsRow}>
                        <View style={styles.statBox}>
                          <Text
                            variant="labelSmall"
                            style={{ color: theme.colors.onSurfaceVariant }}
                          >
                            Xuất phát
                          </Text>
                          <Text
                            variant="bodyMedium"
                            style={{
                              fontWeight: "700",
                              color: theme.colors.outline,
                            }}
                          >
                            {obj.baseline_accuracy_pct}%
                          </Text>
                        </View>
                        <MaterialCommunityIcons
                          name="arrow-right"
                          size={14}
                          color={theme.colors.outline}
                        />
                        <View style={styles.statBox}>
                          <Text
                            variant="labelSmall"
                            style={{ color: theme.colors.onSurfaceVariant }}
                          >
                            Hiện tại
                          </Text>
                          <Text
                            variant="bodyMedium"
                            style={{ fontWeight: "700", color: badge.color }}
                          >
                            {obj.current_accuracy_pct}%
                          </Text>
                        </View>
                        <MaterialCommunityIcons
                          name="flag-checkered"
                          size={14}
                          color={theme.colors.outline}
                        />
                        <View style={styles.statBox}>
                          <Text
                            variant="labelSmall"
                            style={{ color: theme.colors.onSurfaceVariant }}
                          >
                            Mục tiêu
                          </Text>
                          <Text
                            variant="bodyMedium"
                            style={{
                              fontWeight: "700",
                              color: theme.colors.primary,
                            }}
                          >
                            {obj.target_accuracy_pct}%
                          </Text>
                        </View>
                      </View>

                      {/* Progress bar */}
                      <View style={styles.objProgressRow}>
                        <ProgressBar
                          progress={progressRatio}
                          color={badge.color}
                          style={styles.objProgressBar}
                        />
                        <Text
                          variant="labelSmall"
                          style={{
                            color: badge.color,
                            marginLeft: 8,
                            minWidth: 36,
                          }}
                        >
                          {Math.round(progressRatio * 100)}%
                        </Text>
                      </View>

                      {/* Status + trend */}
                      <View style={styles.statusRow}>
                        <View
                          style={[
                            styles.trendBadge,
                            { backgroundColor: theme.colors.surfaceVariant },
                          ]}
                        >
                          <MaterialCommunityIcons
                            name={badge.icon as any}
                            size={13}
                            color={badge.color}
                          />
                          <MaterialCommunityIcons
                            name={trend.icon as any}
                            size={11}
                            color={trend.color}
                            style={{ marginLeft: 4 }}
                          />
                          <Text
                            variant="labelSmall"
                            style={{
                              color: theme.colors.onSurfaceVariant,
                              marginLeft: 3,
                            }}
                          >
                            {trend.label}
                          </Text>
                        </View>
                        {obj.last_session_date && (
                          <Text
                            variant="labelSmall"
                            style={{ color: theme.colors.outline }}
                          >
                            Gần nhất: {obj.last_session_date}
                            {obj.last_session_accuracy
                              ? ` · ${obj.last_session_accuracy}%`
                              : ""}
                          </Text>
                        )}
                      </View>
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
  container: {
    padding: 16,
    paddingBottom: 40,
    backgroundColor: theme.colors.background,
  },
  goalCard: {
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    elevation: 2,
  },
  goalHeader: { flexDirection: "row", marginBottom: 8 },
  domainChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  goalName: { fontWeight: "600", marginBottom: 12, lineHeight: 20 },
  progressSection: { marginBottom: 8 },
  progressLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  progressBar: { height: 8, borderRadius: 4 },
  expandRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  objectivesContainer: { marginTop: 4 },
  objectivesHeader: {
    marginBottom: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  objectiveCard: {
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  objectiveName: { fontWeight: "600", marginBottom: 10, lineHeight: 18 },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  statBox: { alignItems: "center", flex: 1 },
  objProgressRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  objProgressBar: { flex: 1, height: 6, borderRadius: 3 },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 6,
  },
  trendBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
});
