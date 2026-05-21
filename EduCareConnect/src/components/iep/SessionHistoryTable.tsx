import React from "react";
import { View, StyleSheet } from "react-native";
import { DataTable, Text, useTheme } from "react-native-paper";
import { formatDate } from "@utils/formatters";
import { PROMPT_LEVEL_SHORT_LABELS } from "@utils/labels";
import type { SessionResult } from "@t";

interface SessionHistoryTableProps {
  results: SessionResult[];
}

export function SessionHistoryTable({ results }: SessionHistoryTableProps) {
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

  return (
    <DataTable>
      <DataTable.Header>
        <DataTable.Title>Ngày</DataTable.Title>
        <DataTable.Title numeric>Đúng/Tổng</DataTable.Title>
        <DataTable.Title numeric>%</DataTable.Title>
        {/* 1. Thêm numeric vào Title để nó căn phải giống dữ liệu bên dưới */}
        <DataTable.Title numeric>Mức hỗ trợ</DataTable.Title>
      </DataTable.Header>

      {results.slice(0, 10).map((r) => (
        <DataTable.Row key={r.id}>
          <DataTable.Cell>
            <Text variant="bodySmall">{formatDate(r.session_date)}</Text>
          </DataTable.Cell>
          <DataTable.Cell numeric>
            <Text variant="bodySmall">
              {r.correct_trials}/{r.total_trials}
            </Text>
          </DataTable.Cell>
          <DataTable.Cell numeric>
            <Text
              variant="bodySmall"
              style={{
                color:
                  r.accuracy_pct >= 80
                    ? theme.colors.primary
                    : r.accuracy_pct >= 50
                      ? "#F57C00"
                      : theme.colors.error,
                fontWeight: "600",
              }}
            >
              {Math.round(r.accuracy_pct)}%
            </Text>
          </DataTable.Cell>

          {/* 2. Đổi style flex-end thành prop numeric cho đồng bộ với Header */}
          <DataTable.Cell numeric>
            <Text variant="labelSmall" numberOfLines={1}>
              {PROMPT_LEVEL_SHORT_LABELS[r.prompt_level_used] ||
                r.prompt_level_used ||
                "—"}
            </Text>
          </DataTable.Cell>
        </DataTable.Row>
      ))}
    </DataTable>
  );
}

const styles = StyleSheet.create({
  empty: { alignItems: "center", paddingVertical: 24 },
});
