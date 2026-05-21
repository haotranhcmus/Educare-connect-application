import React, { Suspense } from "react";
import { View, ScrollView, StyleSheet, RefreshControl } from "react-native";
import { Text, useTheme, Divider } from "react-native-paper";
import { StatusBadge } from "@components/common/StatusBadge";
import { SectionHeader } from "@components/common/SectionHeader";
import { MetricsCard } from "@components/iep/MetricsCard";
import { SessionHistoryTable } from "@components/iep/SessionHistoryTable";
import { ProgressLineChart } from "@components/iep/ProgressLineChart";
import {
  useObjectiveDetailSuspense,
  useObjectiveResults,
} from "@hooks/useIep";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { TeacherIepStackParamList } from "@navigation/types";
import {
  IepObjectiveDetailSkeleton,
  IepObjectiveChartSkeleton,
  IepObjectiveHistorySkeleton,
} from "@screens/teacher/iep/IepObjectiveDetailSkeleton";

type Props = NativeStackScreenProps<
  TeacherIepStackParamList,
  "IepObjectiveDetail"
>;

function IepObjectiveDetailContent({ route }: Props) {
  const { objectiveId } = route.params;
  const theme = useTheme();
  const { data: objective, refetch } = useObjectiveDetailSuspense(objectiveId);
  // Fetch up to 90 sessions so the chart spans ~3 months of data.
  const { data: results = [], isLoading: resultsLoading } = useObjectiveResults(
    objectiveId,
    90,
  );

  const goalName = Array.isArray(objective.goal_id) ? objective.goal_id[1] : "";

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} />}
    >
      {/* Objective header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.headerRow}>
          <Text
            variant="labelLarge"
            style={{ color: theme.colors.primary, fontWeight: "700" }}
          >
            {objective.objective_code}
          </Text>
          <StatusBadge status={objective.status} />
        </View>
        <Text variant="bodyMedium" style={{ marginTop: 4 }}>
          {objective.name}
        </Text>
        {goalName ? (
          <Text
            variant="labelSmall"
            style={{ color: theme.colors.outline, marginTop: 4 }}
          >
            Mục tiêu dài hạn: {goalName}
          </Text>
        ) : null}
        {objective.description ? (
          <>
            <Divider style={{ marginVertical: 8 }} />
            <Text
              variant="bodySmall"
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              {objective.description}
            </Text>
          </>
        ) : null}
      </View>

      {/* Metrics */}
      <SectionHeader icon="chart-box-outline" title="Chỉ số hiệu suất" />
      <MetricsCard objective={objective} />

      {/* Progress line chart + history — load độc lập với objective header */}
      {resultsLoading ? (
        <>
          <IepObjectiveChartSkeleton />
          <IepObjectiveHistorySkeleton rows={5} />
        </>
      ) : (
        <>
          {results.length >= 2 && (
            <View style={{ paddingHorizontal: 4, marginTop: 4 }}>
              <SectionHeader icon="chart-line" title="Tiến độ theo thời gian" />
              <ProgressLineChart
                results={results}
                targetAccuracy={objective.target_accuracy_pct}
                baselineAccuracy={objective.baseline_accuracy_pct}
              />
            </View>
          )}

          <View style={{ marginTop: 16, width: "100%" }}>
            <SectionHeader
              icon="table-clock"
              title={`Lịch sử buổi học (${results.length})`}
            />
          </View>
          <View
            style={[
              styles.tableContainer,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            <SessionHistoryTable results={results} />
          </View>
        </>
      )}

      {/* Teaching info */}
      {(objective.measurement_method || objective.materials_needed) && (
        <>
          <View style={{ marginTop: 16 }}>
            <SectionHeader
              icon="book-open-variant"
              title="Phương pháp giảng dạy"
            />
          </View>
          <View
            style={[
              styles.infoCard,
              { backgroundColor: theme.colors.surface, marginBottom: 16 },
            ]}
          >
            {objective.measurement_method && (
              <View style={styles.infoRow}>
                <Text
                  variant="labelSmall"
                  style={{ color: theme.colors.outline }}
                >
                  Phương pháp:
                </Text>
                <Text variant="bodySmall" style={{ marginLeft: 4 }}>
                  {objective.measurement_method}
                </Text>
              </View>
            )}
            {objective.materials_needed && (
              <View style={styles.infoRow}>
                <Text
                  variant="labelSmall"
                  style={{ color: theme.colors.outline }}
                >
                  Tài liệu:
                </Text>
                <Text variant="bodySmall" style={{ marginLeft: 4 }}>
                  {objective.materials_needed}
                </Text>
              </View>
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
}

export function IepObjectiveDetailScreen(props: Props) {
  return (
    <Suspense fallback={<IepObjectiveDetailSkeleton />}>
      <IepObjectiveDetailContent {...props} />
    </Suspense>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 32 },
  header: { padding: 16, borderRadius: 12, elevation: 1, marginBottom: 16 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tableContainer: { borderRadius: 12, elevation: 1, overflow: "hidden" },
  infoCard: { padding: 12, borderRadius: 12, elevation: 1, gap: 6 },
  infoRow: { flexDirection: "row", flexWrap: "wrap" },
});
