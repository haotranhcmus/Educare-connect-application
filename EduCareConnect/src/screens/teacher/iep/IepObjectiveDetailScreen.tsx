import React, { Suspense, useMemo } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Image,
} from "react-native";
import { Text, useTheme, Divider } from "react-native-paper";
import { StatusBadge } from "@components/common/StatusBadge";
import { SectionHeader } from "@components/common/SectionHeader";
import { MetricsCard } from "@components/iep/MetricsCard";
import { MeasurementMethodCard } from "@components/iep/MeasurementMethodCard";
import { SessionHistoryTable } from "@components/iep/SessionHistoryTable";
import { ProgressLineChart } from "@components/iep/ProgressLineChart";
import { useObjectiveDetailSuspense, useObjectiveResults } from "@hooks/useIep";
import type { SessionResult, IepObjectiveDetail } from "@t";
import { formatDate } from "@utils/formatters";
import { PROMPT_LEVEL_LABELS } from "@utils/labels";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { TeacherIepStackParamList } from "@navigation/types";
import {
  IepObjectiveDetailSkeleton,
  IepObjectiveChartSkeleton,
  IepObjectiveHistorySkeleton,
} from "@screens/teacher/iep/IepObjectiveDetailSkeleton";

// ── Phase History Section ─────────────────────────────────────────────────────

const STAR_YELLOW = require("../../../../assets/star/star-yellow.png");

// 5 sao = độc lập (tốt nhất) … 1 sao = từ chối / không phản hồi (kém nhất)
const LEVEL_STARS: Record<string, number> = {
  independent: 5,
  gestural_visual: 4,
  verbal: 3,
  physical: 2,
  no_response: 1,
};

const scoreColor = (pct: number) =>
  pct >= 80 ? "#2E7D32" : pct >= 50 ? "#E65100" : "#C62828";

// Detailed per-session breakdown for prompt_level objectives: each trial's
// support level + points, so reviewers see exactly how the score was formed.
function PromptLevelHistory({
  results,
  theme,
}: {
  results: SessionResult[];
  theme: any;
}) {
  const sorted = [...results]
    .sort((a, b) => (b.session_date || "").localeCompare(a.session_date || ""))
    .slice(0, 10);
  return (
    <View style={{ gap: 10 }}>
      {sorted.map((r) => {
        const pct = Math.round(r.score_pct ?? 0);
        const col = scoreColor(pct);
        const trials = [...(r.trials ?? [])].sort(
          (a, b) => a.sequence - b.sequence,
        );
        return (
          <View
            key={r.id}
            style={[
              styles.plCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.outlineVariant,
              },
            ]}
          >
            <View style={styles.plHeader}>
              <Text
                style={{ fontWeight: "700", color: theme.colors.onSurface }}
              >
                {formatDate(r.session_date)}
              </Text>
              <View
                style={[styles.plScoreChip, { backgroundColor: col + "22" }]}
              >
                <Text style={{ color: col, fontWeight: "800", fontSize: 13 }}>
                  {pct}%
                </Text>
              </View>
            </View>
            {trials.length === 0 ? (
              <Text style={{ color: theme.colors.outline, fontSize: 12 }}>
                Không có dữ liệu lần thử.
              </Text>
            ) : (
              trials.map((t, i) => {
                const stars = LEVEL_STARS[t.prompt_level] ?? 0;
                return (
                  <View key={t.id} style={styles.plTrialRow}>
                    <Text
                      style={[
                        styles.plTrialNo,
                        { color: theme.colors.onSurfaceVariant },
                      ]}
                    >
                      Lần {i + 1}
                    </Text>
                    <View style={styles.plStars}>
                      {Array.from({ length: stars }).map((_, s) => (
                        <Image
                          key={s}
                          source={STAR_YELLOW}
                          style={styles.plStarImg}
                          resizeMode="contain"
                        />
                      ))}
                    </View>
                    <Text
                      style={[
                        styles.plTrialLabel,
                        { color: theme.colors.onSurface },
                      ]}
                      numberOfLines={1}
                    >
                      {PROMPT_LEVEL_LABELS[t.prompt_level] || t.prompt_level}
                    </Text>
                    <Text style={[styles.plTrialPts, { color: col }]}>
                      {t.weight}%
                    </Text>
                  </View>
                );
              })
            )}
          </View>
        );
      })}
    </View>
  );
}

interface ChartCfg {
  unit: string;
  seriesLabel: string;
  chartType: "line" | "bar";
  target?: number;
  baseline?: number;
  maxValue?: number;
  valueOf: (r: SessionResult) => number;
}

// Decide what to plot per measurement type — frequency uses bars of raw counts,
// duration plots raw seconds, accuracy/prompt plot the normalized score (%).
function chartConfig(objective: IepObjectiveDetail): ChartCfg {
  const mt = objective.measurement_type;
  if (mt === "duration") {
    return {
      unit: "s",
      seriesLabel: "Thời gian (giây)",
      chartType: "line",
      target: objective.target_duration_seconds,
      valueOf: (r) => r.actual_duration_seconds ?? 0,
    };
  }
  if (mt === "frequency_increase" || mt === "frequency_decrease") {
    return {
      unit: " lần",
      seriesLabel: "Số lần",
      chartType: "bar",
      target: objective.target_count,
      baseline: objective.baseline_count,
      valueOf: (r) => r.actual_count ?? 0,
    };
  }
  return {
    unit: "%",
    seriesLabel: mt === "prompt_level" ? "Mức hỗ trợ" : "Độ chính xác",
    chartType: "line",
    target: objective.target_accuracy_pct,
    baseline: objective.baseline_accuracy_pct,
    maxValue: 100,
    valueOf: (r) => r.score_pct ?? 0,
  };
}

interface PhaseHistorySectionProps {
  objective: IepObjectiveDetail;
  results: SessionResult[];
  theme: any;
}

function PhaseHistorySection({
  objective,
  results,
  theme,
}: PhaseHistorySectionProps) {
  const cfg = useMemo(() => chartConfig(objective), [objective]);
  const intervention = useMemo(
    () =>
      results.filter(
        (r) => r.result_phase === "intervention" || !r.result_phase,
      ),
    [results],
  );
  const maintenance = useMemo(
    () => results.filter((r) => r.result_phase === "maintenance"),
    [results],
  );

  const toPoints = (rows: SessionResult[]) =>
    rows.map((r) => ({ session_date: r.session_date, value: cfg.valueOf(r) }));

  return (
    <>
      {/* ── Can thiệp ── */}
      <View style={{ marginTop: 4 }}>
        <SectionHeader
          icon="school-outline"
          title={`Can thiệp (${intervention.length} buổi)`}
        />
      </View>
      {intervention.length >= 2 && (
        <View style={{ paddingHorizontal: 4, marginBottom: 8 }}>
          <ProgressLineChart
            results={toPoints(intervention)}
            target={cfg.target}
            baseline={cfg.baseline}
            unit={cfg.unit}
            seriesLabel={cfg.seriesLabel}
            chartType={cfg.chartType}
            maxValue={cfg.maxValue}
          />
        </View>
      )}
      {intervention.length > 0 ? (
        objective.measurement_type === "prompt_level" ? (
          <PromptLevelHistory results={intervention} theme={theme} />
        ) : (
          <View
            style={[
              styles.tableContainer,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            <SessionHistoryTable
              results={intervention}
              measurementType={objective.measurement_type}
            />
          </View>
        )
      ) : (
        <Text
          variant="bodySmall"
          style={{
            color: theme.colors.outline,
            paddingHorizontal: 4,
            marginBottom: 8,
          }}
        >
          Chưa có buổi can thiệp nào được đánh giá.
        </Text>
      )}

      {/* ── Duy trì ── */}
      <View style={{ marginTop: 20 }}>
        <SectionHeader
          icon="check-decagram-outline"
          title={`Duy trì (${maintenance.length} buổi)`}
        />
      </View>
      {maintenance.length >= 2 && (
        <View style={{ paddingHorizontal: 4, marginBottom: 8 }}>
          <ProgressLineChart
            results={toPoints(maintenance)}
            target={cfg.target}
            baseline={cfg.baseline}
            unit={cfg.unit}
            seriesLabel={cfg.seriesLabel}
            chartType={cfg.chartType}
            maxValue={cfg.maxValue}
          />
        </View>
      )}
      {maintenance.length > 0 ? (
        objective.measurement_type === "prompt_level" ? (
          <PromptLevelHistory results={maintenance} theme={theme} />
        ) : (
          <View
            style={[
              styles.tableContainer,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            <SessionHistoryTable
              results={maintenance}
              measurementType={objective.measurement_type}
            />
          </View>
        )
      ) : (
        <Text
          variant="bodySmall"
          style={{
            color: theme.colors.outline,
            paddingHorizontal: 4,
            marginBottom: 8,
          }}
        >
          Chưa có buổi duy trì nào. Sau khi bé đạt thành thạo, các buổi củng cố
          kỹ năng sẽ hiển thị ở đây.
        </Text>
      )}
    </>
  );
}

function DetailField({
  label,
  value,
  theme,
}: {
  label: string;
  value: string;
  theme: any;
}) {
  return (
    <View style={styles.detailField}>
      <Text variant="labelSmall" style={{ color: theme.colors.outline }}>
        {label}
      </Text>
      <Text
        variant="bodySmall"
        style={{ color: theme.colors.onSurface, marginTop: 1 }}
      >
        {value}
      </Text>
    </View>
  );
}

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

      {/* Cách đánh giá */}
      <MeasurementMethodCard objective={objective} />

      {/* Metrics */}
      <SectionHeader icon="chart-box-outline" title="Chỉ số hiệu suất" />
      <MetricsCard objective={objective} />

      {/* Progress history split: intervention | maintenance */}
      {resultsLoading ? (
        <>
          <IepObjectiveChartSkeleton />
          <IepObjectiveHistorySkeleton rows={5} />
        </>
      ) : (
        <PhaseHistorySection
          objective={objective}
          results={results}
          theme={theme}
        />
      )}

      {/* Teaching info */}
      {/* Tiêu chí SMART */}
      {(objective.smart_specific ||
        objective.smart_measurable ||
        objective.smart_analysis ||
        objective.smart_timebound) && (
        <>
          <View style={{ marginTop: 16 }}>
            <SectionHeader icon="bullseye-arrow" title="Tiêu chí SMART" />
          </View>
          <View
            style={[
              styles.infoCard,
              { backgroundColor: theme.colors.surface, marginBottom: 16 },
            ]}
          >
            {objective.smart_specific ? (
              <DetailField
                label="S — Cụ thể"
                value={objective.smart_specific}
                theme={theme}
              />
            ) : null}
            {objective.smart_measurable ? (
              <DetailField
                label="M — Đo lường được"
                value={objective.smart_measurable}
                theme={theme}
              />
            ) : null}
            {objective.smart_analysis ? (
              <DetailField
                label="A/R — Khả thi & Phù hợp"
                value={objective.smart_analysis}
                theme={theme}
              />
            ) : null}
            {objective.smart_timebound ? (
              <DetailField
                label="T — Thời hạn"
                value={objective.smart_timebound}
                theme={theme}
              />
            ) : null}
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
  tableContainer: {
    borderRadius: 12,
    elevation: 1,
    overflow: "hidden",
    marginBottom: 8,
  },
  infoCard: { padding: 12, borderRadius: 12, elevation: 1, gap: 6 },
  infoRow: { flexDirection: "row", flexWrap: "wrap" },
  detailField: { marginBottom: 8 },

  // Prompt-level per-session detail cards
  plCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  plHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  plScoreChip: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 20,
  },
  plTrialRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  plTrialNo: {
    fontSize: 12,
    fontWeight: "600",
    width: 44,
  },
  plStars: {
    flexDirection: "row",
    gap: 1,
    width: 78,
  },
  plStarImg: {
    width: 13,
    height: 13,
  },
  plTrialLabel: {
    flex: 1,
    fontSize: 12,
  },
  plTrialPts: {
    fontSize: 12,
    fontWeight: "700",
    width: 40,
    textAlign: "right",
  },
});
