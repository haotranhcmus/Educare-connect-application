import React, { useState, useCallback } from "react";
import { View, ScrollView, StyleSheet, RefreshControl } from "react-native";
import { Text, useTheme, Divider, FAB, Chip } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StatusBadge } from "../../../components/common/StatusBadge";
import { SectionHeader } from "../../../components/common/SectionHeader";
import { GoalCard } from "../../../components/iep/GoalCard";
import { EmptyState } from "../../../components/common/EmptyState";
import { LoadingOverlay } from "../../../components/common/LoadingOverlay";
import { useIepPlanDetail, useGoalsForPlan } from "../../../hooks/useIep";
import { formatDate } from "../../../utils/formatters";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { TeacherIepStackParamList } from "../../../navigation/types";

type Props = NativeStackScreenProps<TeacherIepStackParamList, "IepPlanDetail">;

export function IepPlanDetailScreen({ route, navigation }: Props) {
  const { planId } = route.params;
  const theme = useTheme();
  const {
    data: plan,
    isLoading: planLoading,
    refetch,
  } = useIepPlanDetail(planId);
  const { data: goals = [], isLoading: goalsLoading } = useGoalsForPlan(planId);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const isLoading = planLoading || goalsLoading;

  const toggleGoal = useCallback((goalId: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(goalId) ? next.delete(goalId) : next.add(goalId);
      return next;
    });
  }, []);

  const handleObjectivePress = useCallback(
    (objectiveId: number) => {
      const routeNames: string[] = navigation?.getState?.()?.routeNames ?? [];
      const objectiveRoute = routeNames.includes("IepObjectiveDetail")
        ? "IepObjectiveDetail"
        : "ChildIepObjectiveDetail";
      navigation.navigate(objectiveRoute as never, { objectiveId } as never);
    },
    [navigation],
  );

  if (isLoading && !plan) return <LoadingOverlay visible />;
  if (!plan) return null;

  const studentName = Array.isArray(plan.student_id) ? plan.student_id[1] : "";

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={refetch} />
        }
      >
        {/* Plan Header */}
        <View
          style={[styles.planHeader, { backgroundColor: theme.colors.surface }]}
        >
          <View style={styles.planHeaderRow}>
            <Text variant="titleMedium" style={{ fontWeight: "700" }}>
              {plan.iep_period}
            </Text>
            <StatusBadge status={plan.status} />
          </View>

          <View style={styles.planMeta}>
            <MetaRow
              icon="account-child"
              label="Học sinh"
              value={studentName}
            />
            <MetaRow
              icon="tag-outline"
              label="Phiên bản"
              value={`v${plan.version_number || 1}`}
            />
            <MetaRow
              icon="calendar-range"
              label="Thời gian"
              value={`${formatDate(plan.start_date)} - ${formatDate(plan.end_date)}`}
            />
            {plan.supervisor_approved && plan.supervisor_id && (
              <MetaRow
                icon="check-decagram"
                label="Phê duyệt"
                value={
                  Array.isArray(plan.supervisor_id)
                    ? (plan.supervisor_id as any)[1]
                    : ((plan.supervisor_id as any)?.name ?? "")
                }
              />
            )}
          </View>
        </View>

        {/* Goals section */}
        <SectionHeader
          icon="target"
          title={`Mục tiêu dài hạn (${goals.length})`}
        />

        {goals.length === 0 ? (
          <EmptyState
            icon="target"
            title="Chưa có mục tiêu"
            description="Thêm mục tiêu dài hạn cho kế hoạch này"
          />
        ) : (
          goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              expanded={expandedIds.has(goal.id)}
              onToggle={() => toggleGoal(goal.id)}
              onObjectivePress={handleObjectivePress}
            />
          ))
        )}
      </ScrollView>

      {plan.status === "draft" && (
        <FAB
          icon="pencil"
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          onPress={() => {
            // TODO: navigate to edit plan
          }}
          color="#fff"
        />
      )}
    </View>
  );
}

function MetaRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  const theme = useTheme();
  return (
    <View style={styles.metaRow}>
      <MaterialCommunityIcons
        name={icon as any}
        size={16}
        color={theme.colors.outline}
      />
      <Text
        variant="labelSmall"
        style={{ color: theme.colors.outline, marginLeft: 4 }}
      >
        {label}:
      </Text>
      <Text variant="bodySmall" style={{ marginLeft: 4 }}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 80 },
  planHeader: { padding: 16, borderRadius: 12, marginBottom: 16, elevation: 1 },
  planHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  planMeta: { marginTop: 12, gap: 6 },
  metaRow: { flexDirection: "row", alignItems: "center" },
  fab: { position: "absolute", right: 16, bottom: 16, borderRadius: 16 },
});
