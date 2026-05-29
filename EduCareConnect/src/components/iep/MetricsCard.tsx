import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, useTheme, Divider } from "react-native-paper";
import Svg, { Circle, Path, G, Text as SvgText } from "react-native-svg";
import { ProgressBar } from "@components/common/ProgressBar";
import { TrendChip } from "@components/common/TrendChip";
import { formatDurationSeconds } from "@utils/formatters";
import {
  PROMPT_LEVEL_LABELS,
  PROMPT_LEVEL_SHORT_LABELS,
  pctToPromptLevel,
} from "@utils/labels";
import type { IepObjectiveDetail } from "@t";

interface MetricsCardProps {
  objective: IepObjectiveDetail;
}

// ── Semi-circle gauge using react-native-svg ─────────────────
function SemiGauge({
  value,
  max = 100,
  size = 100,
  color = "#1565C0",
  trackColor = "#E3F2FD",
}: {
  value: number;
  max?: number;
  size?: number;
  color?: string;
  trackColor?: string;
}) {
  const stroke = 10;
  const r = (size - stroke) / 2; // radius = 45 for size=100
  const cx = size / 2; // center x = 50
  // Place center so arc top is at y ≈ stroke/2 (just inside the viewBox).
  const cy = r + stroke / 2; // = 50 for size=100
  // SVG height: chord (cy) + half-stroke overflow + gap + value text
  const svgH = cy + stroke / 2 + 22; // ≈ 77 for size=100

  // Clamp progress to avoid SVG arc edge cases at exactly 0 or 360°.
  const pct = Math.max(0, Math.min(0.999, value / max));

  // ── Track: full upper semi-circle split into two 90° arcs ──
  // Splitting avoids the SVG ambiguity when start/end are a diameter apart (180°).
  // sweep=1 = clockwise in SVG screen-space = goes UPWARD through the top ✓
  // (sweep=0 would draw counter-clockwise = going DOWN through the bottom half = wrong)
  const trackPath = [
    `M ${cx - r} ${cy}`, // start: left tip of chord
    `A ${r} ${r} 0 0 1 ${cx} ${cy - r}`, // clockwise: left → apex (top)
    `A ${r} ${r} 0 0 1 ${cx + r} ${cy}`, // clockwise: apex → right tip
  ].join(" ");

  // ── Progress arc: left → pct% around upper semi-circle ────
  // Parametrisation: angle goes from 180° (left) toward 0° (right) as pct → 1.
  //   x = cx − r·cos(pct·π),  y = cy − r·sin(pct·π)
  // pct=0   → (cx-r, cy)  = left tip  ✓
  // pct=0.5 → (cx,   cy-r)= apex top  ✓
  // pct=1   → (cx+r, cy)  = right tip ✓
  const ex = cx - r * Math.cos(pct * Math.PI);
  const ey = cy - r * Math.sin(pct * Math.PI);
  // Arc is always ≤ 180°, so largeArc is always 0.
  // sweep=1 clockwise = goes through the top, same direction as the track.
  const progressPath =
    pct > 0.01
      ? `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${ex.toFixed(2)} ${ey.toFixed(2)}`
      : null;

  return (
    <View style={{ width: size, height: svgH }}>
      <Svg width={size} height={svgH} viewBox={`0 0 ${size} ${svgH}`}>
        <G>
          {/* Track */}
          <Path
            d={trackPath}
            stroke={trackColor}
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="round"
          />
          {/* Progress */}
          {progressPath ? (
            <Path
              d={progressPath}
              stroke={color}
              strokeWidth={stroke}
              fill="none"
              strokeLinecap="round"
            />
          ) : null}
          {/* Value label below the chord */}
          <SvgText
            x={cx}
            y={cy + 16}
            textAnchor="middle"
            fontSize={size * 0.2}
            fontWeight="bold"
            fill={color}
          >
            {Math.round(value)}%
          </SvgText>
        </G>
      </Svg>
    </View>
  );
}

export function MetricsCard({ objective }: MetricsCardProps) {
  const theme = useTheme();

  const mt = objective.measurement_type;
  const currentPct = Math.round(objective.current_accuracy_pct || 0);

  const fmtSeconds = formatDurationSeconds;

  // Per measurement type: left / center / right tiles + card title.
  // Center is a SemiGauge for accuracy (the only type where % is the natural
  // unit). Every other type shows the *current value* in its own unit, so
  // baseline / current / target all sit in the same dimension.
  let cardTitle = "Tiến độ";
  let leftTile: { label: string; value: string; color?: string } | null = null;
  let rightTile: { label: string; value: string; color?: string } | null = null;
  let centerTile: { label: string; value: string } | null = null;

  if (mt === "accuracy") {
    cardTitle = "Độ chính xác";
    leftTile = {
      label: "Mức ban đầu",
      value: `${objective.baseline_accuracy_pct}%`,
    };
    rightTile = {
      label: "Mục tiêu",
      value: `${objective.target_accuracy_pct}%`,
      color: "#4CAF50",
    };
  } else if (mt === "prompt_level") {
    cardTitle = "Mức độ hỗ trợ";
    const baselineLvl = pctToPromptLevel(objective.baseline_accuracy_pct || 0);
    const targetLvl =
      (objective.target_prompt_level as string | false | undefined) ||
      pctToPromptLevel(objective.target_accuracy_pct || 0);
    const currentLvl = pctToPromptLevel(currentPct);
    leftTile = {
      label: "Mức ban đầu",
      value: PROMPT_LEVEL_SHORT_LABELS[baselineLvl] ?? baselineLvl,
    };
    rightTile = {
      label: "Mục tiêu",
      value: PROMPT_LEVEL_SHORT_LABELS[targetLvl] ?? targetLvl,
      color: "#4CAF50",
    };
    centerTile = {
      label: "Mức can thiệp hiện tại",
      value: PROMPT_LEVEL_LABELS[currentLvl] ?? currentLvl,
    };
  } else if (mt === "duration") {
    cardTitle = "Thời gian";
    const targetSec = objective.target_duration_seconds || 0;
    const currentSec = Math.round((targetSec * currentPct) / 100);
    leftTile = {
      label: "Mức ban đầu",
      value: fmtSeconds(0),
    };
    rightTile = {
      label: "Mục tiêu",
      value: fmtSeconds(targetSec),
      color: "#4CAF50",
    };
    centerTile = { label: "Hiện tại", value: fmtSeconds(currentSec) };
  } else if (mt === "frequency_increase") {
    cardTitle = "Tần suất (tăng hành vi)";
    const tgt = objective.target_count || 0;
    const current = Math.round((tgt * currentPct) / 100);
    leftTile = {
      label: "Cơ sở",
      value: `${objective.baseline_count || 0} lần`,
    };
    rightTile = {
      label: "Mục tiêu",
      value: `${tgt} lần`,
      color: "#4CAF50",
    };
    centerTile = { label: "Hiện tại", value: `${current} lần` };
  } else if (mt === "frequency_decrease") {
    cardTitle = "Tần suất (giảm hành vi)";
    const baseline = objective.baseline_count || 0;
    const cap = objective.target_count || 0;
    const current = Math.round(
      baseline - ((baseline - cap) * currentPct) / 100,
    );
    leftTile = {
      label: "Cơ sở",
      value: `${baseline} lần`,
    };
    rightTile = {
      label: "Tối đa cho phép",
      value: `${cap} lần`,
      color: "#4CAF50",
    };
    centerTile = { label: "Hiện tại", value: `${current} lần` };
  }

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <Text
        variant="labelMedium"
        style={{ color: theme.colors.outline, fontWeight: "700" }}
      >
        {cardTitle}
      </Text>
      {/* Top row: left | center (gauge for accuracy, text tile otherwise) | right
          alignItems: "stretch" + each cell uses space-between so the label
          always hugs the top edge and the value the bottom edge, even when
          one cell's text wraps onto a second line (e.g. prompt_level). */}
      <View style={styles.accuracyRow}>
        {leftTile && (
          <View style={styles.metricItem}>
            <Text
              variant="labelSmall"
              numberOfLines={4}
              style={[styles.tileLabel, { color: theme.colors.outline }]}
            >
              {leftTile.label}
            </Text>
            <Text
              variant="titleMedium"
              numberOfLines={4}
              style={[
                styles.tileValue,
                { fontWeight: "700", color: leftTile.color },
              ]}
            >
              {leftTile.value}
            </Text>
          </View>
        )}

        <View style={styles.centerCell}>
          {mt === "accuracy" ? (
            <>
              <SemiGauge
                value={currentPct}
                max={100}
                size={100}
                color={theme.colors.primary}
                trackColor={theme.colors.surfaceVariant}
              />
              <Text
                variant="labelSmall"
                style={{ color: theme.colors.outline, marginTop: -4 }}
              >
                Hiện tại
              </Text>
            </>
          ) : centerTile ? (
            <>
              <Text
                variant="labelSmall"
                numberOfLines={4}
                style={[styles.tileLabel, { color: theme.colors.outline }]}
              >
                {centerTile.label}
              </Text>
              <Text
                variant="titleMedium"
                numberOfLines={4}
                style={[
                  styles.tileValue,
                  {
                    fontWeight: "800",
                    color: theme.colors.primary,
                  },
                ]}
              >
                {centerTile.value}
              </Text>
            </>
          ) : null}
        </View>

        {rightTile && (
          <View style={styles.metricItem}>
            <Text
              variant="labelSmall"
              numberOfLines={4}
              style={[styles.tileLabel, { color: theme.colors.outline }]}
            >
              {rightTile.label}
            </Text>
            <Text
              variant="titleMedium"
              numberOfLines={4}
              style={[
                styles.tileValue,
                { fontWeight: "700", color: rightTile.color },
              ]}
            >
              {rightTile.value}
            </Text>
          </View>
        )}
      </View>

      {/* <View style={styles.progressLabelRow}>
        <Text variant="labelSmall" style={{ color: theme.colors.outline }}>
          Tiến độ hoàn thành
        </Text>
        <Text
          variant="labelSmall"
          style={{ color: theme.colors.onSurface, fontWeight: "600" }}
        >
          {Math.round(objective.progress_pct || 0)}%
        </Text>
      </View> */}
      <ProgressBar progress={objective.progress_pct || 0} size="medium" />

      <Divider style={{ marginVertical: 8 }} />

      {/* Secondary metrics */}
      <View style={styles.secondaryRow}>
        <View style={styles.secondaryItem}>
          <Text variant="labelSmall" style={{ color: theme.colors.outline }}>
            Xu hướng
          </Text>
          {objective.trend ? (
            <TrendChip trend={objective.trend} />
          ) : (
            <Text variant="bodySmall">—</Text>
          )}
        </View>
        <View style={styles.secondaryItem}>
          <Text variant="labelSmall" style={{ color: theme.colors.outline }}>
            Tổng buổi
          </Text>
          <Text variant="bodyMedium" style={{ fontWeight: "600" }}>
            {objective.total_sessions_worked || 0}
          </Text>
        </View>
        <View style={styles.secondaryItem}>
          <Text variant="labelSmall" style={{ color: theme.colors.outline }}>
            Buổi liên tiếp đạt
          </Text>
          <Text variant="bodyMedium" style={{ fontWeight: "600" }}>
            {objective.consecutive_sessions_achieved || 0}/
            {objective.consecutive_sessions_required || 3}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16, borderRadius: 12, elevation: 1 },
  accuracyRow: {
    flexDirection: "row",
    alignItems: "stretch",
    marginBottom: 8,
    minHeight: 80,
  },
  // Each cell is 1/3 wide; label pinned to top, value pinned to bottom via
  // justifyContent: space-between. That way long wrapping text in one cell
  // (e.g. prompt level full name) does not push the other cells' labels or
  // values out of alignment — the top and bottom edges stay flush.
  metricItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    paddingVertical: 4,
    gap: 4,
  },
  centerCell: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
    gap: 4,
  },
  tileLabel: { textAlign: "center" },
  tileValue: { textAlign: "center" },
  progressLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  secondaryRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 8,
  },
  secondaryItem: { alignItems: "center", gap: 4 },
});
