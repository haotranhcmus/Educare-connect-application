import React from "react";
import { FlatList, View, StyleSheet, TouchableOpacity } from "react-native";
import { Text, Button, useTheme } from "react-native-paper";
import { useStudentReports } from "../../../../hooks/useReports";
import { StatusBadge } from "../../../../components/common/StatusBadge";
import { EmptyState } from "../../../../components/common/EmptyState";
import { formatDate } from "../../../../utils/formatters";
import type { ReportListItem } from "../../../../types";

interface Props {
  studentId: number;
  navigation: any;
}

export function StudentReportTab({ studentId, navigation }: Props) {
  const theme = useTheme();
  const {
    data: reports = [],
    isLoading,
    refetch,
    isRefetching,
  } = useStudentReports(studentId);

  const navigateToReportTab = (
    screen: "ReportDetail" | "ReportCreate",
    params: Record<string, number>,
  ) => {
    const parent = navigation.getParent?.();
    const canNavigateViaParentTab = parent
      ?.getState?.()
      ?.routeNames?.includes("ReportTab");

    if (canNavigateViaParentTab) {
      parent.navigate("ReportTab", { screen, params });
      return;
    }

    navigation.navigate("TeacherTabs", {
      screen: "ReportTab",
      params: { screen, params },
    });
  };

  const renderReport = ({ item }: { item: ReportListItem }) => (
    <TouchableOpacity
      onPress={() => navigateToReportTab("ReportDetail", { reportId: item.id })}
      activeOpacity={0.7}
    >
      <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.cardRow}>
          <Text variant="labelMedium">{item.name}</Text>
          <StatusBadge status={item.status} size="small" />
        </View>
        <Text
          variant="bodySmall"
          style={{ color: theme.colors.onSurfaceVariant }}
        >
          {formatDate(item.report_date)}
        </Text>
        {item.activity_summary && (
          <Text
            variant="bodySmall"
            style={{ color: theme.colors.onSurface, marginTop: 4 }}
            numberOfLines={2}
          >
            {item.activity_summary}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={styles.buttonContainer}>
        {/* <Button
          mode="outlined"
          icon="plus"
          onPress={() => navigateToReportTab("ReportCreate", { studentId })}
        >
          Tạo báo cáo mới
        </Button> */}
      </View>
      <FlatList
        data={reports}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderReport}
        onRefresh={refetch}
        refreshing={isRefetching}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState icon="file-document-remove" title="Chưa có báo cáo" />
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  buttonContainer: { padding: 16 },
  list: { flexGrow: 1, paddingHorizontal: 16, paddingBottom: 16 },
  card: { padding: 12, borderRadius: 12, marginBottom: 8, elevation: 1 },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
});
