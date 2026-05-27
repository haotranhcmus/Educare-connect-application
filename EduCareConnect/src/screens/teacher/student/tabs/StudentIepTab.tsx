import React from "react";
import { FlatList } from "react-native";
import { useTheme } from "react-native-paper";
import { useStudentIepPlans } from "@hooks/useIep";
import { EmptyState } from "@components/common/EmptyState";
import { IepPlanCard } from "@components/iep/IepPlanCard";
import IepPlaceholderJson from "@assets/placeholder/json/iep-placeholder.json";
import type { IepPlan } from "@t";

interface NavigateOnly {
  navigate: (route: string, params?: Record<string, unknown>) => void;
}

interface Props {
  studentId: number;
  navigation: NavigateOnly;
  detailRouteName?: string;
  objectiveRouteName?: string;
}

export function StudentIepTab({
  studentId,
  navigation,
  detailRouteName = "IepPlanDetail",
  objectiveRouteName = "IepObjectiveDetail",
}: Props) {
  const theme = useTheme();
  const {
    data: plans = [],
    isLoading,
    refetch,
    isRefetching,
  } = useStudentIepPlans(studentId);

  const handlePress = (plan: IepPlan) => {
    navigation.navigate(detailRouteName, {
      planId: plan.id,
      studentName: plan.iep_period,
      objectiveRouteName,
    });
  };

  return (
    <FlatList
      data={plans}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => (
        <IepPlanCard item={item} onPress={() => handlePress(item)} />
      )}
      onRefresh={refetch}
      refreshing={isRefetching}
      contentContainerStyle={{ flexGrow: 1, padding: 16, gap: 12 }}
      ListEmptyComponent={
        !isLoading ? (
          <EmptyState
            lottie={IepPlaceholderJson}
            title="Chưa có kế hoạch IEP"
          />
        ) : null
      }
      style={{ flex: 1, backgroundColor: theme.colors.background }}
    />
  );
}
