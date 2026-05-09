import React from "react";
import { FlatList, View, StyleSheet, TouchableOpacity } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useStudentIepPlans } from "../../../hooks/useIep";
import { StatusBadge } from "../../../components/common/StatusBadge";
import { EmptyState } from "../../../components/common/EmptyState";
import { formatDate } from "../../../utils/formatters";
import type { IepPlan } from "../../../types";

interface Props {
  studentId: number;
  navigation: any;
  detailRouteName?: string;
}

export function ChildProgressTab({
  studentId,
  navigation,
  detailRouteName = "IepPlanDetail",
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
    });
  };

  const renderPlan = ({ item }: { item: IepPlan }) => {
    const supervisor = Array.isArray(item.supervisor_id)
      ? item.supervisor_id[1]
      : "";

    return (
      <TouchableOpacity onPress={() => handlePress(item)} activeOpacity={0.7}>
        <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.cardHeader}>
            <Text variant="titleSmall" style={{ fontWeight: "bold" }}>
              {item.iep_period}
            </Text>
            <StatusBadge status={item.status} />
          </View>
          <Text
            variant="bodySmall"
            style={{ color: theme.colors.onSurfaceVariant }}
          >
            Phiên bản {item.version_number}
          </Text>
          <Text
            variant="bodySmall"
            style={{ color: theme.colors.onSurfaceVariant }}
          >
            {formatDate(item.start_date)} → {formatDate(item.end_date)}
          </Text>
          {supervisor && (
            <Text
              variant="bodySmall"
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              Supervisor: {supervisor}
            </Text>
          )}
          <View style={styles.cardFooter}>
            <Text variant="labelSmall" style={{ color: theme.colors.outline }}>
              {item.goal_count || 0} mục tiêu dài hạn
            </Text>
            <MaterialCommunityIcons
              name="chevron-right"
              size={20}
              color={theme.colors.outline}
            />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <FlatList
      data={plans}
      keyExtractor={(item) => item.id.toString()}
      renderItem={renderPlan}
      onRefresh={refetch}
      refreshing={isRefetching}
      contentContainerStyle={styles.list}
      ListEmptyComponent={
        !isLoading ? (
          <EmptyState icon="clipboard-text-off" title="Chưa có kế hoạch IEP" />
        ) : null
      }
      style={{ flex: 1, backgroundColor: theme.colors.background }}
    />
  );
}

const styles = StyleSheet.create({
  list: { flexGrow: 1, padding: 16 },
  card: { padding: 12, borderRadius: 12, marginBottom: 8, elevation: 1 },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
});
