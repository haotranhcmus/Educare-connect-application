import React, { useMemo } from "react";
import { SectionList, View, StyleSheet } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { useStudentReports } from "../../../../hooks/useReports";
import { ReportListCard } from "../../../../components/report/ReportListCard";
import { EmptyState } from "../../../../components/common/EmptyState";
import ReportPlaceholder from "../../../../../assets/placeholder/report-placeholder.svg";
import { formatDate } from "../../../../utils/formatters";
import { groupByDate } from "../../../../utils/groupByDate";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { StudentStackParamList } from "../../../../navigation/types";
import { SafeAreaView } from "react-native-safe-area-context";

type StudentDetailNav = NativeStackNavigationProp<
  StudentStackParamList,
  "StudentDetail"
>;

interface Props {
  studentId: number;
  navigation: StudentDetailNav;
}

export function StudentReportTab({ studentId, navigation }: Props) {
  const theme = useTheme();
  const {
    data: reports = [],
    isLoading,
    refetch,
    isRefetching,
  } = useStudentReports(studentId);

  const sections = useMemo(
    () => groupByDate(reports, (r) => r.report_date),
    [reports],
  );

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      edges={["bottom"]}
    >
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id.toString()}
        onRefresh={refetch}
        refreshing={isRefetching}
        contentContainerStyle={styles.list}
        renderSectionHeader={({ section }) => (
          <Text
            variant="labelMedium"
            style={[styles.sectionHeader, { color: theme.colors.outline }]}
          >
            {formatDate(section.title)}
          </Text>
        )}
        renderItem={({ item }) => (
          <ReportListCard
            report={item}
            onPress={() => navigation.navigate("ReportDetail", { reportId: item.id })}
          />
        )}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState image={ReportPlaceholder} title="Chưa có báo cáo" />
          ) : null
        }
        stickySectionHeadersEnabled={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  list: { flexGrow: 1, paddingHorizontal: 16, paddingBottom: 16 },
  sectionHeader: { paddingVertical: 8, fontWeight: "600" },
});
