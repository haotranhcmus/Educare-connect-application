import React from "react";
import { RefreshControl } from "react-native";
import Animated from "react-native-reanimated";
import { useTheme } from "react-native-paper";
import { useStudentIepPlans } from "@hooks/useIep";
import { EmptyState } from "@components/common/EmptyState";
import { IepPlanCard } from "@components/iep/IepPlanCard";
import IepPlaceHolderJson from "@assets/placeholder/json/iep-placeholder.json";
import type { IepPlan } from "@t";

interface NavigateOnly {
  navigate: (route: string, params?: Record<string, unknown>) => void;
}

interface Props {
  studentId: number;
  navigation: NavigateOnly;
  detailRouteName?: string;
  objectiveRouteName?: string;
  contentInsetTop?: number;
}

export function ChildProgressTab({
  studentId,
  navigation,
  detailRouteName = "IepPlanDetail",
  objectiveRouteName = "IepObjectiveDetail",
  contentInsetTop = 0,
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
    <Animated.FlatList
      data={plans}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => (
        <IepPlanCard item={item} onPress={() => handlePress(item)} />
      )}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={refetch}
          progressViewOffset={contentInsetTop}
        />
      }
      contentContainerStyle={{
        flexGrow: 1,
        padding: 16,
        gap: 12,
        paddingTop: contentInsetTop + 16,
      }}
      ListEmptyComponent={
        !isLoading ? (
          <EmptyState
            lottie={IepPlaceHolderJson}
            title="Chưa có kế hoạch IEP"
          />
        ) : null
      }
      style={{ flex: 1, backgroundColor: theme.colors.background }}
    />
  );
}
