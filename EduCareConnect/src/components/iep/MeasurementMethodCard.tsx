import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { MEASUREMENT_TYPE_LABELS } from "@utils/labels";
import type { MeasurementType } from "@t";

export interface MeasurementInfo {
  measurement_type: MeasurementType;
  baseline_accuracy_pct?: number;
  target_accuracy_pct?: number;
  target_duration_seconds?: number;
  baseline_count?: number;
  target_count?: number;
  consecutive_sessions_required?: number;
}

function fmtSeconds(s: number): string {
  return s >= 60
    ? `${Math.floor(s / 60)}'${String(s % 60).padStart(2, "0")}"`
    : `${s}s`;
}

/** Human-readable mastery criterion for the objective's measurement type. */
function criteriaText(o: MeasurementInfo): string {
  switch (o.measurement_type) {
    case "accuracy":
      return `Đạt ≥ ${o.target_accuracy_pct ?? 0}% độ chính xác (từ mức ${o.baseline_accuracy_pct ?? 0}%).`;
    case "prompt_level":
      return `Đạt ≥ ${o.target_accuracy_pct ?? 0}% điểm hỗ trợ — chấm theo mức hỗ trợ từng lần thử.`;
    case "duration":
      return `Duy trì hành vi mục tiêu ≥ ${fmtSeconds(o.target_duration_seconds ?? 0)}.`;
    case "frequency_increase":
      return `Tăng lên ≥ ${o.target_count ?? 0} lần/buổi (mức cơ sở ${o.baseline_count ?? 0} lần).`;
    case "frequency_decrease":
      return `Giảm còn ≤ ${o.target_count ?? 0} lần/buổi (mức cơ sở ${o.baseline_count ?? 0} lần).`;
    default:
      return "";
  }
}

export function MeasurementMethodCard({
  objective,
}: {
  objective: MeasurementInfo;
}) {
  const theme = useTheme();
  const label =
    MEASUREMENT_TYPE_LABELS[objective.measurement_type] ||
    objective.measurement_type;

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.header}>
        <View
          style={[
            styles.iconWrap,
            { backgroundColor: theme.colors.primaryContainer },
          ]}
        >
          <MaterialCommunityIcons
            name="clipboard-check-outline"
            size={18}
            color={theme.colors.primary}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.eyebrow, { color: theme.colors.outline }]}>
            CÁCH ĐÁNH GIÁ
          </Text>
          <Text
            variant="bodyMedium"
            style={{ fontWeight: "700", color: theme.colors.primary }}
          >
            {label}
          </Text>
        </View>
      </View>

      <View style={styles.row}>
        <MaterialCommunityIcons
          name="target"
          size={15}
          color={theme.colors.primary}
        />
        <Text
          variant="bodySmall"
          style={{ color: theme.colors.onSurface, flex: 1 }}
        >
          {criteriaText(objective)}
        </Text>
      </View>

      {objective.consecutive_sessions_required ? (
        <View style={styles.row}>
          <MaterialCommunityIcons
            name="repeat"
            size={15}
            color={theme.colors.primary}
          />
          <Text
            variant="bodySmall"
            style={{ color: theme.colors.onSurface, flex: 1 }}
          >
            Cần đạt {objective.consecutive_sessions_required} buổi liên tiếp.
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 14,
    borderRadius: 12,
    elevation: 1,
    marginBottom: 16,
    gap: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  eyebrow: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.4,
    marginBottom: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
});
