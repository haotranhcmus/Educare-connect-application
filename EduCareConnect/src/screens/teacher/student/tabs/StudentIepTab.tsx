import React from "react";
import { FlatList, View, StyleSheet, TouchableOpacity } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useStudentIepPlans } from "../../../../hooks/useIep";
import { StatusBadge } from "../../../../components/common/StatusBadge";
import { EmptyState } from "../../../../components/common/EmptyState";
import { formatDate } from "../../../../utils/formatters";
import type { IepPlan } from "../../../../types";

interface Props {
  studentId: number;
  navigation: any;
  detailRouteName?: string;
}

export function StudentIepTab({
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
          {/* Accent top bar */}
          <View
            style={[
              styles.accentBar,
              { backgroundColor: theme.colors.primary + "20" },
            ]}
          />

          {/* Header: Period + Status */}
          <View style={styles.cardContent}>
            <View style={styles.titleRow}>
              <Text
                variant="titleMedium"
                style={[styles.periodTitle, { color: theme.colors.onSurface }]}
              >
                {item.iep_period}
              </Text>
              <StatusBadge status={item.status} size="medium" />
            </View>

            {/* Info rows */}
            <View style={styles.infoSection}>
              <View style={styles.infoRow}>
                <Text
                  variant="labelSmall"
                  style={{ color: theme.colors.outline }}
                >
                  Phiên bản
                </Text>
                <Text
                  variant="bodySmall"
                  style={{ color: theme.colors.onSurfaceVariant }}
                >
                  v{item.version_number}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text
                  variant="labelSmall"
                  style={{ color: theme.colors.outline }}
                >
                  Kỳ
                </Text>
                <Text
                  variant="bodySmall"
                  style={{ color: theme.colors.onSurfaceVariant }}
                  numberOfLines={1}
                >
                  {formatDate(item.start_date)} → {formatDate(item.end_date)}
                </Text>
              </View>
            </View>

            {/* Supervisor */}
            {supervisor && (
              <View style={styles.supervisorSection}>
                <MaterialCommunityIcons
                  name="account-tie"
                  size={16}
                  color={theme.colors.outline}
                  style={{ marginRight: 6 }}
                />
                <Text
                  variant="labelSmall"
                  style={{ color: theme.colors.outline }}
                >
                  {supervisor}
                </Text>
              </View>
            )}

            {/* Divider */}
            <View
              style={[
                styles.divider,
                { backgroundColor: theme.colors.outlineVariant },
              ]}
            />

            {/* Footer: Goal count */}
            <View style={styles.footerRow}>
              <View style={styles.goalInfo}>
                <MaterialCommunityIcons
                  name="target"
                  size={16}
                  color={theme.colors.primary}
                  style={{ marginRight: 6 }}
                />
                <Text
                  variant="labelMedium"
                  style={{ color: theme.colors.onSurface, fontWeight: "600" }}
                >
                  {item.goal_count || 0} mục tiêu dài hạn
                </Text>
              </View>
              <MaterialCommunityIcons
                name="chevron-right"
                size={20}
                color={theme.colors.outline}
              />
            </View>
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
  card: {
    borderRadius: 12,
    marginBottom: 10,
    elevation: 2,
    overflow: "hidden",
  },
  accentBar: {
    height: 4,
  },
  cardContent: {
    padding: 12,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
    gap: 8,
  },
  periodTitle: {
    flex: 1,
    fontWeight: "700",
  },
  infoSection: {
    gap: 6,
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  supervisorSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  divider: {
    height: 1,
    marginVertical: 10,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  goalInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
});
