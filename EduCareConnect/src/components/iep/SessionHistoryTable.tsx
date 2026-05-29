import React from "react";
import { View, StyleSheet } from "react-native";
import { DataTable, Text, useTheme } from "react-native-paper";
import { formatDate, formatDurationSeconds } from "@utils/formatters";
import type { SessionResult, MeasurementType } from "@t";

interface SessionHistoryTableProps {
  results: SessionResult[];
  measurementType: MeasurementType;
}

/** Header label for the detail column, per measurement type. */
const DETAIL_HEADER: Record<MeasurementType, string> = {
  accuracy: "Đúng/Tổng",
  prompt_level: "Số lần thử",
  duration: "Thời gian",
  frequency_increase: "Số lần",
  frequency_decrease: "Số lần",
};

/** Per-row detail value, matching the objective's measurement type. */
function rowDetail(r: SessionResult, mt: MeasurementType): string {
  switch (mt) {
    case "accuracy":
      return `${r.correct_trials ?? 0}/${r.total_trials ?? 0}`;
    case "duration":
      return formatDurationSeconds(r.actual_duration_seconds ?? 0);
    case "frequency_increase":
    case "frequency_decrease":
      return `${r.actual_count ?? 0} lần`;
    case "prompt_level":
      return `${r.trial_ids?.length ?? 0} lần`;
    default:
      return "—";
  }
}

export function SessionHistoryTable({
  results,
  measurementType,
}: SessionHistoryTableProps) {
  const theme = useTheme();

  if (results.length === 0) {
    return (
      <View style={styles.empty}>
        <Text variant="bodySmall" style={{ color: theme.colors.outline }}>
          Chưa có kết quả buổi học
        </Text>
      </View>
    );
  }

  // % score column only makes sense for accuracy & prompt_level. For duration
  // and frequency the detail column already shows the raw value in its real
  // unit, so the extra "Điểm %" is noise.
  const showScorePct =
    measurementType === "accuracy" || measurementType === "prompt_level";

  return (
    <DataTable>
      <DataTable.Header>
        <DataTable.Title>Ngày</DataTable.Title>
        <DataTable.Title numeric>
          {DETAIL_HEADER[measurementType] || "Chi tiết"}
        </DataTable.Title>
        {showScorePct ? <DataTable.Title numeric>Điểm</DataTable.Title> : null}
      </DataTable.Header>

      {results.slice(0, 10).map((r) => (
        <DataTable.Row key={r.id}>
          <DataTable.Cell>
            <Text variant="bodySmall">{formatDate(r.session_date)}</Text>
          </DataTable.Cell>
          <DataTable.Cell numeric>
            <Text variant="bodySmall">{rowDetail(r, measurementType)}</Text>
          </DataTable.Cell>
          {showScorePct ? (
            <DataTable.Cell numeric>
              <Text
                variant="bodySmall"
                style={{
                  color:
                    r.score_pct >= 80
                      ? theme.colors.primary
                      : r.score_pct >= 50
                        ? "#F57C00"
                        : theme.colors.error,
                  fontWeight: "600",
                }}
              >
                {Math.round(r.score_pct ?? 0)}%
              </Text>
            </DataTable.Cell>
          ) : null}
        </DataTable.Row>
      ))}
    </DataTable>
  );
}

const styles = StyleSheet.create({
  empty: { alignItems: "center", paddingVertical: 24 },
});
