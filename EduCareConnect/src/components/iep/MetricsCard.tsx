import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, useTheme, Divider } from "react-native-paper";
import Svg, { Circle, Path, G, Text as SvgText } from "react-native-svg";
import { ProgressBar } from "@components/common/ProgressBar";
import { TrendChip } from "@components/common/TrendChip";
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

  const fmtSeconds = (s: number) =>
    s >= 60 ? `${Math.floor(s / 60)}'${String(s % 60).padStart(2, "0")}"` : `${s}s`;

  // Per measurement type: which two flanking tiles + title + gauge caption to show.
  let cardTitle = "Tiến độ";
  let gaugeCaption = "Đã đạt";
  let leftTile: { label: string; value: string; color?: string } | null = null;
  let rightTile: { label: string; value: string; color?: string } | null = null;

  if (mt === "accuracy" || mt === "prompt_level") {
    cardTitle = mt === "prompt_level" ? "Mức độ hỗ trợ" : "Độ chính xác";
    gaugeCaption = "Hiện tại";
    leftTile = { label: "Mức ban đầu", value: `${objective.baseline_accuracy_pct}%` };
    rightTile = {
      label: "Mục tiêu",
      value: `${objective.target_accuracy_pct}%`,
      color: "#4CAF50",
    };
  } else if (mt === "duration") {
    cardTitle = "Thời gian";
    leftTile = {
      label: "Thời gian mục tiêu",
      value: fmtSeconds(objective.target_duration_seconds || 0),
      color: "#4CAF50",
    };
  } else if (mt === "frequency_increase") {
    cardTitle = "Tần suất (tăng hành vi)";
    leftTile = { label: "Cơ sở", value: `${objective.baseline_count || 0} lần` };
    rightTile = {
      label: "Mục tiêu",
      value: `${objective.target_count || 0} lần`,
      color: "#4CAF50",
    };
  } else if (mt === "frequency_decrease") {
    cardTitle = "Tần suất (giảm hành vi)";
    leftTile = { label: "Cơ sở", value: `${objective.baseline_count || 0} lần` };
    rightTile = {
      label: "Tối đa cho phép",
      value: `${objective.target_count || 0} lần`,
      color: "#4CAF50",
    };
  }

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <Text variant="labelMedium" style={{ color: theme.colors.outline, fontWeight: "700" }}>
        {cardTitle}
      </Text>
      {/* Top row: leftTile | GAUGE | rightTile */}
      <View style={styles.accuracyRow}>
        {leftTile && (
          <View style={styles.metricItem}>
            <Text variant="labelSmall" style={{ color: theme.colors.outline }}>
              {leftTile.label}
            </Text>
            <Text
              variant="titleMedium"
              style={{ fontWeight: "700", color: leftTile.color }}
            >
              {leftTile.value}
            </Text>
          </View>
        )}

        {/* Center: gauge = % achievement of the goal */}
        <View style={{ alignItems: "center" }}>
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
            {gaugeCaption}
          </Text>
        </View>

        {rightTile && (
          <View style={styles.metricItem}>
            <Text variant="labelSmall" style={{ color: theme.colors.outline }}>
              {rightTile.label}
            </Text>
            <Text
              variant="titleMedium"
              style={{ fontWeight: "700", color: rightTile.color }}
            >
              {rightTile.value}
            </Text>
          </View>
        )}
      </View>

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
    justifyContent: "space-around",
    alignItems: "center",
    marginBottom: 8,
  },
  metricItem: { alignItems: "center", gap: 4 },
  secondaryRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 8,
  },
  secondaryItem: { alignItems: "center", gap: 4 },
});
