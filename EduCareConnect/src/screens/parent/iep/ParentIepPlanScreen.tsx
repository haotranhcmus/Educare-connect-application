import React, { useState } from "react";
import { ScrollView, View, StyleSheet } from "react-native";
import { Text, Card, useTheme } from "react-native-paper";
import { ParentGoalCard } from "../../../components/parent/ParentGoalCard";
import { LoadingOverlay } from "../../../components/common/LoadingOverlay";
import { EmptyState } from "../../../components/common/EmptyState";
import { useGoalsWithObjectives } from "../../../hooks/useParent";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { ParentTimetableStackParamList } from "../../../navigation/types";

type Props = NativeStackScreenProps<
  ParentTimetableStackParamList,
  "ChildIepPlanDetail"
>;

export function ParentIepPlanScreen({ route }: Props) {
  const theme = useTheme();
  const { planId, plan } = route.params;
  const { data: goals = [], isLoading } = useGoalsWithObjectives(planId);
  const [expandedGoals, setExpandedGoals] = useState<Set<number>>(new Set());

  const toggleGoal = (goalId: number) => {
    setExpandedGoals((prev) => {
      const next = new Set(prev);
      if (next.has(goalId)) next.delete(goalId);
      else next.add(goalId);
      return next;
    });
  };

  if (isLoading) return <LoadingOverlay visible />;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.container}
    >
      {plan && (
        <Card style={styles.headerCard} mode="outlined">
          <Card.Content>
            <Text variant="titleMedium">{plan.iep_period}</Text>
            <Text variant="bodySmall" style={{ color: "#757575" }}>
              {plan.start_date} → {plan.end_date}
            </Text>
          </Card.Content>
        </Card>
      )}

      {goals.length === 0 ? (
        <EmptyState
          icon="clipboard-text-outline"
          title="Chưa có mục tiêu"
          description="Kế hoạch này chưa có mục tiêu nào."
        />
      ) : (
        goals.map((goal: any) => (
          <ParentGoalCard
            key={goal.id}
            goal={goal}
            isExpanded={expandedGoals.has(goal.id)}
            onToggle={() => toggleGoal(goal.id)}
          />
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  headerCard: { marginBottom: 16, borderRadius: 12 },
});
