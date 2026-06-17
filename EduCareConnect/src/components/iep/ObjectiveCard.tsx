import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity, Pressable } from "react-native";
import { Text, useTheme, Divider, MD3Theme } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StatusBadge } from "@components/common/StatusBadge";
import type { IepObjectiveListItem, MeasurementType } from "@t";
import { formatDate, formatDurationSeconds } from "@utils/formatters";
import { PROMPT_LEVEL_SHORT_LABELS, pctToPromptLevel } from "@utils/labels";
import { theme } from "@theme";

/** Color accent + short chip label per measurement type. */
const TYPE_ACCENTS: Record<
  MeasurementType,
  { color: string; bg: string; short: string }
> = {
  accuracy: { color: "#1565C0", bg: "#E3F2FD", short: "Độ chính xác" },
  prompt_level: { color: "#6A1B9A", bg: "#F3E5F5", short: "Mức hỗ trợ" },
  duration: { color: "#EF6C00", bg: "#FFF3E0", short: "Thời gian" },
  frequency_increase: {
    color: "#2E7D32",
    bg: "#E8F5E9",
    short: "Tần suất ↑",
  },
  frequency_decrease: {
    color: "#C62828",
    bg: "#FFEBEE",
    short: "Tần suất ↓",
  },
};

interface TileTriple {
  leftLabel: string;
  leftValue: string;
  centerValue: string;
  rightLabel: string;
  rightValue: string;
}

/** 3-stat tile content adapted to the objective's measurement type.
 *  Middle cell is always derived from current_accuracy_pct but rendered in the
 *  same unit as the side tiles, so all three cells share one unit per row. */
function getTiles(o: IepObjectiveListItem): TileTriple {
  const pct = Math.max(0, Math.min(100, o.current_accuracy_pct ?? 0));
  switch (o.measurement_type) {
    case "duration": {
      const targetSec = o.target_duration_seconds ?? 0;
      const currentSec = Math.round((targetSec * pct) / 100);
      return {
        leftLabel: "Mục tiêu",
        leftValue: formatDurationSeconds(targetSec),
        centerValue: formatDurationSeconds(currentSec),
        rightLabel: "Buổi liên tiếp",
        rightValue: `${o.consecutive_sessions_achieved ?? 0}/${o.consecutive_sessions_required ?? 0}`,
      };
    }
    case "frequency_increase": {
      const tgt = o.target_count ?? 0;
      const current = Math.round((tgt * pct) / 100);
      return {
        leftLabel: "Cơ sở",
        leftValue: `${o.baseline_count ?? 0} lần`,
        centerValue: `${current} lần`,
        rightLabel: "Mục tiêu",
        rightValue: `${tgt} lần`,
      };
    }
    case "frequency_decrease": {
      // For decrease, "current" = baseline reduced toward target (cap).
      const baseline = o.baseline_count ?? 0;
      const cap = o.target_count ?? 0;
      const current = Math.round(baseline - ((baseline - cap) * pct) / 100);
      return {
        leftLabel: "Cơ sở",
        leftValue: `${baseline} lần`,
        centerValue: `${current} lần`,
        rightLabel: "Tối đa",
        rightValue: `${cap} lần`,
      };
    }
    case "prompt_level": {
      const targetLvl =
        (o.target_prompt_level as string | false | undefined) ||
        pctToPromptLevel(o.target_accuracy_pct ?? 0);
      const baselineLvl = pctToPromptLevel(o.baseline_accuracy_pct ?? 0);
      const currentLvl = pctToPromptLevel(pct);
      return {
        leftLabel: "Ban đầu",
        leftValue: PROMPT_LEVEL_SHORT_LABELS[baselineLvl] ?? baselineLvl,
        centerValue: PROMPT_LEVEL_SHORT_LABELS[currentLvl] ?? currentLvl,
        rightLabel: "Mục tiêu",
        rightValue: PROMPT_LEVEL_SHORT_LABELS[targetLvl] ?? targetLvl,
      };
    }
    default:
      // accuracy
      return {
        leftLabel: "Ban đầu",
        leftValue: `${o.baseline_accuracy_pct}%`,
        centerValue: `${Math.round(pct)}%`,
        rightLabel: "Mục tiêu",
        rightValue: `${o.target_accuracy_pct}%`,
      };
  }
}

interface ObjectiveCardProps {
  objective: IepObjectiveListItem;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: (id: number) => void;
  onPress?: (id: number) => void;
}

function ObjectiveCardImpl({
  objective,
  selectable = false,
  selected = false,
  onSelect,
  onPress,
}: ObjectiveCardProps) {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);

  const handlePress = () => {
    if (selectable && onSelect) {
      onSelect(objective.id);
    } else if (onPress) {
      onPress(objective.id);
    }
  };

  const hasDetail =
    selectable &&
    (objective.description ||
      objective.implementation_steps ||
      objective.materials_needed ||
      objective.consecutive_sessions_required);

  // Progress fill: từ baseline → current trên thang đến target
  const progressPct = objective.progress_pct ?? 0;

  const accent =
    TYPE_ACCENTS[objective.measurement_type] ?? TYPE_ACCENTS.accuracy;
  const tiles = getTiles(objective);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.background,
          borderColor: selected
            ? theme.colors.primary
            : theme.colors.outlineVariant,
          borderWidth: selected ? 2 : 0.75,
        },
      ]}
    >
      {/* ─── Main tappable row ─── */}
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.75}
        style={styles.cardInner}
      >
        {/* Header: code + checkbox (selectable) + status badge */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {selectable && (
              <MaterialCommunityIcons
                name={selected ? "checkbox-marked" : "checkbox-blank-outline"}
                size={20}
                color={selected ? theme.colors.primary : theme.colors.outline}
                style={{ marginRight: 6 }}
              />
            )}
            <Text
              variant="labelSmall"
              style={[styles.codeLabel, { color: theme.colors.primary }]}
            >
              {objective.objective_code}
            </Text>
            <View
              style={[
                styles.typeChip,
                { backgroundColor: accent.bg, marginLeft: 8 },
              ]}
            >
              <Text style={[styles.typeChipText, { color: accent.color }]}>
                {accent.short}
              </Text>
            </View>
          </View>
          <StatusBadge status={objective.status} size="small" />
        </View>

        {/* Objective name */}
        <Text
          variant="bodySmall"
          numberOfLines={expanded ? undefined : 2}
          style={[styles.name, { color: theme.colors.onSurface }]}
        >
          {objective.name}
        </Text>

        {/* ─── Stats row ─── */}
        <View
          style={[styles.statsRow, { backgroundColor: theme.colors.surface }]}
        >
          <StatCell
            value={tiles.leftValue}
            label={tiles.leftLabel}
            theme={theme}
          />
          <View
            style={[
              styles.statDivider,
              { backgroundColor: theme.colors.outlineVariant },
            ]}
          />
          <StatCell
            value={tiles.centerValue}
            label="Hiện tại"
            highlight
            highlightColor={accent.color}
            theme={theme}
          />
          <View
            style={[
              styles.statDivider,
              { backgroundColor: theme.colors.outlineVariant },
            ]}
          />
          <StatCell
            value={tiles.rightValue}
            label={tiles.rightLabel}
            theme={theme}
          />
        </View>

        {/* ─── Footer: progress bar + date + chevron ─── */}
        <View style={styles.footer}>
          <View style={styles.footerProgress}>
            <View
              style={[
                styles.footerProgressTrack,
                { backgroundColor: theme.colors.surfaceVariant },
              ]}
            >
              <View
                style={[
                  styles.footerProgressFill,
                  {
                    width: `${Math.min(progressPct, 100)}%` as any,
                    backgroundColor: accent.color,
                  },
                ]}
              />
            </View>
            <Text
              variant="labelSmall"
              style={{ color: theme.colors.outline, fontWeight: "600" }}
            >
              {Math.round(progressPct)}%
            </Text>
          </View>
          <View style={styles.footerRight}>
            {objective.last_session_date && (
              <Text
                variant="labelSmall"
                style={{ color: theme.colors.outline }}
              >
                {formatDate(objective.last_session_date)}
              </Text>
            )}
            {!selectable && (
              <MaterialCommunityIcons
                name="chevron-right"
                size={16}
                color={theme.colors.outline}
              />
            )}
          </View>
        </View>
      </TouchableOpacity>

      {/* ─── Expand toggle — selectable mode only ─── */}
      {hasDetail && (
        <>
          <Divider />
          <TouchableOpacity
            style={styles.expandRow}
            onPress={() => setExpanded((v) => !v)}
            activeOpacity={0.6}
          >
            <MaterialCommunityIcons
              name={expanded ? "chevron-up" : "chevron-down"}
              size={16}
              color={theme.colors.primary}
            />
          </TouchableOpacity>

          {expanded && (
            <View style={styles.detailSection}>
              {/* Progress bar */}
              <View style={styles.progressWrap}>
                {/* <View style={styles.progressLabelRow}>
                  <Text
                    variant="labelSmall"
                    style={{ color: theme.colors.outline }}
                  >
                    Tiến độ hoàn thành
                  </Text>
                  <Text
                    variant="labelSmall"
                    style={{
                      color: theme.colors.onSurface,
                      fontWeight: "600",
                    }}
                  >
                    {Math.round(progressPct)}%
                  </Text>
                </View> */}
                <View
                  style={[
                    styles.progressTrack,
                    { backgroundColor: theme.colors.surfaceVariant },
                  ]}
                >
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${Math.min(progressPct, 100)}%` as any,
                        backgroundColor: theme.colors.primary,
                      },
                    ]}
                  />
                </View>
              </View>

              {/* Detail rows */}
              {objective.description ? (
                <DetailRow
                  icon="text-box-outline"
                  label="Mô tả mục tiêu"
                  value={objective.description}
                />
              ) : null}
              {objective.implementation_steps ? (
                <DetailRow
                  icon="list-status"
                  label="Các bước thực hiện"
                  value={objective.implementation_steps}
                />
              ) : null}
              {objective.materials_needed ? (
                <DetailRow
                  icon="package-variant-closed"
                  label="Vật liệu cần thiết"
                  value={objective.materials_needed}
                />
              ) : null}

              {/* Consecutive sessions — pill style */}
              {objective.consecutive_sessions_required ? (
                <View
                  style={[
                    styles.consecutivePill,
                    { backgroundColor: theme.colors.surface },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="calendar-check-outline"
                    size={15}
                    color={theme.colors.primary}
                  />
                  <Text
                    variant="labelSmall"
                    style={{ color: theme.colors.primary, flex: 1 }}
                  >
                    Buổi đạt liên tiếp
                  </Text>
                  <Text
                    variant="labelSmall"
                    style={{
                      color: theme.colors.onSurface,
                      fontWeight: "600",
                    }}
                  >
                    {objective.consecutive_sessions_achieved ?? 0} /{" "}
                    {objective.consecutive_sessions_required} buổi
                  </Text>
                </View>
              ) : null}
            </View>
          )}
        </>
      )}
    </View>
  );
}

/* ─── StatCell ─── */
function StatCell({
  value,
  label,
  highlight,
  highlightColor,
  theme,
}: {
  value: string;
  label: string;
  highlight?: boolean;
  highlightColor?: string;
  theme: MD3Theme;
}) {
  return (
    <View style={styles.statCell}>
      <Text
        variant="titleSmall"
        style={{
          color: highlight
            ? (highlightColor ?? theme.colors.primary)
            : theme.colors.onSurface,
          fontWeight: highlight ? "700" : "500",
          fontSize: 15,
        }}
      >
        {value}
      </Text>
      <Text variant="labelSmall" style={{ color: theme.colors.outline }}>
        {label}
      </Text>
    </View>
  );
}

/* ─── DetailRow ─── */
function DetailRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  const theme = useTheme();
  return (
    <View style={styles.detailRow}>
      <MaterialCommunityIcons
        name={icon as any}
        size={15}
        color={theme.colors.primary}
        style={{ marginRight: 8, marginTop: 1 }}
      />
      <View style={{ flex: 1 }}>
        <Text
          variant="labelSmall"
          style={{
            color: theme.colors.outline,
            textTransform: "uppercase",
            letterSpacing: 0.4,
            marginBottom: 2,
            fontSize: 10,
          }}
        >
          {label}
        </Text>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurface }}>
          {value}
        </Text>
      </View>
    </View>
  );
}

export const ObjectiveCard = React.memo(ObjectiveCardImpl);

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    marginBottom: 10,
    overflow: "hidden",
  },
  cardInner: {
    padding: 14,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  codeLabel: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  typeChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  typeChipText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  name: {
    lineHeight: 19,
    marginBottom: 10,
    fontSize: 16,
  },
  /* Stats */
  statsRow: {
    flexDirection: "row",
    alignItems: "stretch",
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 10,
    minHeight: 58,
  },
  statCell: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "space-between",
  },
  statDivider: {
    width: 0.5,
    alignSelf: "stretch",
  },
  /* Footer */
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  footerProgress: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  footerProgressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 99,
    overflow: "hidden",
  },
  footerProgressFill: {
    height: "100%",
    borderRadius: 99,
  },
  footerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  /* Expand */
  expandRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  /* Detail */
  detailSection: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    gap: 12,
  },
  progressWrap: {
    gap: 4,
  },
  progressLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressTrack: {
    height: 5,
    borderRadius: 99,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 99,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  consecutivePill: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    paddingVertical: 9,
    paddingHorizontal: 12,
    gap: 8,
  },
});
