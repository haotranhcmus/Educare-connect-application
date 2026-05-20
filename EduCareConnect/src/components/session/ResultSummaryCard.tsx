import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { PROMPT_LEVEL_LABELS } from "../../utils/labels";
import type { SessionResult } from "../../types";

/** Map accuracy → { color, bg, label } */
function getAccuracyMeta(
  accuracy: number,
  primary: string,
  error: string,
): { color: string; bg: string; label: string } {
  if (accuracy >= 80) return { color: primary, bg: "#E8F5E9", label: "Tốt" };
  if (accuracy >= 50)
    return { color: "#E67E22", bg: "#FFF3E0", label: "Trung bình" };
  return { color: error, bg: "#FFEBEE", label: "Cần cải thiện" };
}

interface ResultSummaryCardProps {
  result: SessionResult;
}

function ResultSummaryCardImpl({ result }: ResultSummaryCardProps) {
  const theme = useTheme();
  const objName = Array.isArray(result.objective_id)
    ? result.objective_id[1]
    : "";
  const objCode = objName.split(" ")[0];
  const displayObjName = objName.substring(objCode.length).trim();

  const accuracy = Math.round(result.accuracy_pct);
  const accMeta = getAccuracyMeta(
    accuracy,
    theme.colors.primary,
    theme.colors.error,
  );
  const promptLabel =
    PROMPT_LEVEL_LABELS[result.prompt_level_used] ||
    result.prompt_level_used ||
    "—";

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.outlineVariant,
        },
      ]}
    >
      {/* ── Header: code badge + tên mục tiêu ── */}
      <View style={styles.header}>
        <View
          style={[
            styles.codeBadge,
            { backgroundColor: theme.colors.primaryContainer },
          ]}
        >
          <Text style={[styles.codeText, { color: theme.colors.primary }]}>
            {objCode}
          </Text>
        </View>
        <Text
          variant="bodyMedium"
          style={[styles.objName, { color: theme.colors.onSurface }]}
        >
          {displayObjName}
        </Text>
      </View>

      {/* ── Progress bar + accuracy badge ── */}
      <View style={styles.barSection}>
        <View
          style={[
            styles.barTrack,
            { backgroundColor: theme.colors.surfaceVariant },
          ]}
        >
          <View
            style={[
              styles.barFill,
              {
                width: `${Math.min(accuracy, 100)}%` as any,
                backgroundColor: accMeta.color,
              },
            ]}
          />
        </View>
        <View
          style={[styles.accBadge, { backgroundColor: theme.colors.surface }]}
        >
          <Text style={[styles.accPct, { color: accMeta.color }]}>
            {accuracy}%
          </Text>
        </View>
      </View>

      {/* ── Stats row ── */}
      <View
        style={[
          styles.statsRow,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.outlineVariant,
          },
        ]}
      >
        {/* Số lần đúng */}
        <View style={styles.statCell}>
          <Text style={styles.statLabel}>Số lần đúng</Text>
          <View style={styles.statValueRow}>
            <Text style={[styles.statBig, { color: theme.colors.onSurface }]}>
              {result.correct_trials}
            </Text>
            <Text
              style={[
                styles.statSmall,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              /{result.total_trials}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.vRule,
            { backgroundColor: theme.colors.outlineVariant },
          ]}
        />

        {/* Kết quả */}
        <View style={styles.statCell}>
          <Text style={styles.statLabel}>Kết quả</Text>
          <Text style={[styles.statBig, { color: accMeta.color }]}>
            {accMeta.label}
          </Text>
        </View>

        <View
          style={[
            styles.vRule,
            { backgroundColor: theme.colors.outlineVariant },
          ]}
        />

        {/* Mức gợi ý */}
        <View style={[styles.statCell, styles.statCellWide]}>
          <Text style={styles.statLabel}>Mức gợi ý</Text>
          <Text
            style={[styles.statBig, { color: theme.colors.onSurface }]}
            numberOfLines={2}
            adjustsFontSizeToFit
            minimumFontScale={0.8}
          >
            {promptLabel}
          </Text>
        </View>
      </View>

      {result.notes ? (
        <View style={styles.notesRow}>
          <MaterialCommunityIcons
            name="note-text-outline"
            size={14}
            color={theme.colors.outline}
            style={{ marginTop: 2 }}
          />
          <Text
            variant="bodySmall"
            style={{ color: theme.colors.onSurfaceVariant, flex: 1 }}
          >
            {result.notes}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

export const ResultSummaryCard = React.memo(ResultSummaryCardImpl);

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    elevation: 2,
    // shadowColor: "#000",
    // shadowOpacity: 0.07,
    // shadowRadius: 6,
    // shadowOffset: { width: 0, height: 3 },
    marginBottom: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  codeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    flexShrink: 0,
  },
  codeText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  objName: {
    flex: 1,
    fontWeight: "500",
    lineHeight: 20,
  },
  barSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  barTrack: {
    flex: 1,
    height: 7,
    borderRadius: 4,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 4,
  },
  accBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
    minWidth: 52,
    alignItems: "center",
  },
  accPct: {
    fontSize: 13,
    fontWeight: "800",
  },
  statsRow: {
    flexDirection: "row",
    borderRadius: 10,
    borderWidth: 1,
    overflow: "hidden",
  },
  statCell: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 4,
    gap: 2,
  },
  statCellWide: {
    flex: 1.4,
  },
  statLabel: {
    fontSize: 10,
    color: "#999",
    textAlign: "center",
    fontWeight: "500",
  },
  statValueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 1,
  },
  statBig: {
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
  statSmall: {
    fontSize: 12,
    fontWeight: "400",
  },
  vRule: {
    width: 1,
    alignSelf: "stretch",
    marginVertical: 8,
  },
  notesRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    paddingTop: 4,
  },
});
