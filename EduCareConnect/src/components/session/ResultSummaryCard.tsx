import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, useTheme } from "react-native-paper";
import type { SessionResult } from "../../types";

const PROMPT_LABEL: Record<string, string> = {
  independent: "Độc lập",
  verbal_prompt: "Gợi ý ngôn ngữ",
  gestural_prompt: "Gợi ý cử chỉ",
  partial_physical: "Hỗ trợ một phần",
  full_physical: "Hỗ trợ hoàn toàn",
};

interface ResultSummaryCardProps {
  result: SessionResult;
}

export function ResultSummaryCard({ result }: ResultSummaryCardProps) {
  const theme = useTheme();
  const objName = Array.isArray(result.objective_id)
    ? result.objective_id[1]
    : "";
  const objCode = objName.split(" ")[0]; // e.g. "OBJ-001"

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <Text
        variant="labelMedium"
        style={{ color: theme.colors.primary, fontWeight: "600" }}
      >
        {objCode}
      </Text>
      <Text variant="bodySmall" numberOfLines={1}>
        {objName}
      </Text>
      <Text
        variant="bodySmall"
        style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}
      >
        {result.correct_trials}/{result.total_trials} →{" "}
        {Math.round(result.accuracy_pct)}%{" "}
        {PROMPT_LABEL[result.prompt_level_used] || result.prompt_level_used}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 10, borderRadius: 10, marginBottom: 6, elevation: 1 },
});
