import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Dimensions,
} from "react-native";
import { LineChart, BarChart } from "react-native-gifted-charts";
import { theme } from "@theme";

// ── Constants ──────────────────────────────────────────────────────────────
const CHART_H = 160;
const DAYS_PER_PAGE = 7;

const Y_LABEL_W = 40;
const WRAPPER_H_PAD = 20;
const CHART_EXTRA_PAD = 20;

const PLOT_W =
  Dimensions.get("window").width - Y_LABEL_W - WRAPPER_H_PAD - CHART_EXTRA_PAD;

const INITIAL_SPACING = 16;
const END_SPACING = 16;

const spacingForN = (n: number) =>
  n > 1
    ? Math.floor((PLOT_W - INITIAL_SPACING - END_SPACING) / (n - 1))
    : PLOT_W - INITIAL_SPACING - END_SPACING;

/** "YYYY-MM-DD" → "DD/MM" */
const fmtDate = (d: string) => `${d.slice(8)}/${d.slice(5, 7)}`;

// ── Types ──────────────────────────────────────────────────────────────────
interface ResultPoint {
  session_date?: string;
  value: number;
}

interface ProgressChartProps {
  results: ResultPoint[];
  /** Reference line for the goal (same unit as values). */
  target?: number;
  /** Reference line for the starting level (same unit as values). */
  baseline?: number;
  /** Unit suffix appended to numbers, e.g. "%", "s", " lần". */
  unit?: string;
  /** Legend label for the data series. */
  seriesLabel?: string;
  /** "line" (accuracy/prompt/duration) or "bar" (frequency). */
  chartType?: "line" | "bar";
  /** Force a y-axis max (percent charts use 100). Auto-computed when omitted. */
  maxValue?: number;
  primaryColor?: string;
  targetColor?: string;
}

export function ProgressLineChart({
  results,
  target,
  baseline,
  unit = "%",
  seriesLabel = "Độ chính xác",
  chartType = "line",
  maxValue,
  primaryColor = "#1565C0",
  targetColor = "#4CAF50",
}: ProgressChartProps) {
  const byDate = useMemo(() => {
    const map = new Map<string, number[]>();
    for (const r of results) {
      if (!r.session_date) continue;
      if (!map.has(r.session_date)) map.set(r.session_date, []);
      map.get(r.session_date)!.push(r.value);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, vals]) => ({
        date,
        acc: Math.round(vals.reduce((s, v) => s + v, 0) / vals.length),
      }));
  }, [results]);

  const totalDays = byDate.length;

  const [startIndex, setStartIndex] = useState(() =>
    Math.max(0, totalDays - DAYS_PER_PAGE),
  );

  const safeStart = Math.max(0, Math.min(startIndex, totalDays - 1));
  const pageData = byDate.slice(safeStart, safeStart + DAYS_PER_PAGE);

  const hasPrev = safeStart > 0;
  const hasNext = safeStart + DAYS_PER_PAGE < totalDays;

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // ── Y-axis scale ──
  const { axisMax, stepValue, noOfSections } = useMemo(() => {
    if (maxValue === 100 || unit === "%") {
      return { axisMax: 100, stepValue: 25, noOfSections: 4 };
    }
    const rawMax = Math.max(
      1,
      ...byDate.map((d) => d.acc),
      target ?? 0,
      baseline ?? 0,
    );
    const sections = 4;
    const step = Math.max(1, Math.ceil((rawMax * 1.15) / sections));
    return { axisMax: step * sections, stepValue: step, noOfSections: sections };
  }, [byDate, target, baseline, maxValue, unit]);

  const isBar = chartType === "bar";
  const BAR_WIDTH = 26;
  const BAR_GAP = 14;
  const lineSpacing = spacingForN(pageData.length) - 3;
  // Bars use a fixed width + small gap so they sit close together (left-aligned)
  // instead of being spread across the full plot width like line points.
  const spacing = isBar ? BAR_GAP : lineSpacing;

  const dataAreaW = isBar
    ? INITIAL_SPACING + END_SPACING + pageData.length * (BAR_WIDTH + BAR_GAP)
    : pageData.length > 1
      ? INITIAL_SPACING + lineSpacing * (pageData.length - 1) + END_SPACING
      : PLOT_W;

  const fmtVal = (v: number) => `${v}${unit}`;

  const chartData = pageData.map((p, i) => {
    if (chartType === "bar") {
      // Bars: always show the raw number above each bar (no unit, no tap needed).
      return {
        value: p.acc,
        label: fmtDate(p.date),
        frontColor: primaryColor,
        topLabelComponent: () => (
          <Text style={[styles.barTopLabel, { color: primaryColor }]}>
            {p.acc}
          </Text>
        ),
      };
    }
    // Lines: show a tooltip bubble only on the tapped point.
    return {
      value: p.acc,
      label: fmtDate(p.date),
      ...(selectedIndex === i
        ? {
            dataPointLabelComponent: () => (
              <View style={styles.tooltipBubble}>
                <Text style={styles.tooltipText}>{fmtVal(p.acc)}</Text>
              </View>
            ),
            dataPointLabelShiftY: -28,
            dataPointLabelShiftX: -6,
          }
        : {}),
    };
  });

  // ── Placeholder ────────────────────────────────────────────────────────
  if (totalDays < 2) {
    return (
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>
          Cần ít nhất 2 buổi để hiển thị biểu đồ
        </Text>
      </View>
    );
  }

  const windowEnd = Math.min(safeStart + DAYS_PER_PAGE - 1, totalDays - 1);

  const commonChartProps = {
    data: chartData,
    width: dataAreaW,
    height: CHART_H,
    maxValue: axisMax,
    noOfSections,
    stepValue,
    yAxisTextStyle: styles.axisText,
    xAxisLabelTextStyle: styles.axisText,
    initialSpacing: INITIAL_SPACING,
    endSpacing: END_SPACING,
    spacing,
    isAnimated: true,
    animationDuration: 400,
    rulesColor: "#EEEEEE",
    rulesType: "solid",
    showReferenceLine1: target != null,
    referenceLine1Position: target ?? 0,
    referenceLine1Config: {
      color: targetColor,
      dashWidth: 5,
      dashGap: 4,
      thickness: 1.5,
      type: "dashed" as const,
    },
    showReferenceLine2: baseline != null,
    referenceLine2Position: baseline ?? 0,
    referenceLine2Config: {
      color: "#FF7043",
      dashWidth: 5,
      dashGap: 4,
      thickness: 1.5,
      type: "dashed" as const,
    },
    onPress: (_item: any, index: number) =>
      setSelectedIndex((prev) => (prev === index ? null : index)),
  };

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <View style={styles.wrapper}>
      {/* ── Legend ── */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View
            style={[
              chartType === "bar" ? styles.legendBar : styles.legendDot,
              { backgroundColor: primaryColor },
            ]}
          />
          <Text style={styles.legendLabel}>{seriesLabel}</Text>
        </View>
        {target != null && (
          <View style={styles.legendItem}>
            <View style={[styles.legendDash, { borderColor: targetColor }]} />
            <Text style={styles.legendLabel}>Mục tiêu {fmtVal(target)}</Text>
          </View>
        )}
        {baseline != null && (
          <View style={styles.legendItem}>
            <View style={[styles.legendDash, { borderColor: "#FF7043" }]} />
            <Text style={styles.legendLabel}>Ban đầu {fmtVal(baseline)}</Text>
          </View>
        )}
      </View>

      <TouchableWithoutFeedback onPress={() => setSelectedIndex(null)}>
        <View style={styles.chartClip}>
          {chartType === "bar" ? (
            <BarChart
              key={`${safeStart}-${selectedIndex}`}
              {...commonChartProps}
              frontColor={primaryColor}
              barWidth={BAR_WIDTH}
              barBorderRadius={4}
            />
          ) : (
            <LineChart
              key={`${safeStart}-${selectedIndex}`}
              {...commonChartProps}
              color={primaryColor}
              thickness={2.5}
              hideDataPoints={false}
              dataPointsColor={primaryColor}
              dataPointsRadius={5}
              focusEnabled
              focusedDataPointColor={primaryColor}
              focusedDataPointRadius={8}
              showStripOnFocus
              stripWidth={1}
              stripColor="rgba(21,101,192,0.20)"
              showTextOnFocus={false}
            />
          )}
        </View>
      </TouchableWithoutFeedback>

      {/* ── Pagination ── */}
      <View style={styles.navRow}>
        <TouchableOpacity
          style={[styles.navBtn, !hasPrev && styles.navBtnOff]}
          onPress={() => {
            setSelectedIndex(null);
            setStartIndex((s) => Math.max(0, s - 1));
          }}
          disabled={!hasPrev}
          activeOpacity={0.7}
        >
          <Text style={[styles.navText, !hasPrev && styles.navTextOff]}>
            ← Trước
          </Text>
        </TouchableOpacity>

        <Text style={styles.pageInfo}>
          {fmtDate(byDate[safeStart].date)}
          {" – "}
          {fmtDate(byDate[windowEnd].date)}
          {" · "}
          {totalDays} ngày
        </Text>

        <TouchableOpacity
          style={[styles.navBtn, !hasNext && styles.navBtnOff]}
          onPress={() => {
            setSelectedIndex(null);
            setStartIndex((s) =>
              Math.min(s + 1, Math.max(0, totalDays - DAYS_PER_PAGE)),
            );
          }}
          disabled={!hasNext}
          activeOpacity={0.7}
        >
          <Text style={[styles.navText, !hasNext && styles.navTextOff]}>
            Tiếp →
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 10,
    elevation: 2,
  },
  chartClip: {
    overflow: "hidden",
    borderRadius: 8,
  },
  placeholder: {
    alignItems: "center",
    justifyContent: "center",
    height: 80,
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
  },
  placeholderText: { color: "#9E9E9E", fontSize: 13 },
  legendRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 8,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendBar: { width: 10, height: 10, borderRadius: 2 },
  legendDash: {
    width: 14,
    height: 0,
    borderTopWidth: 2,
    borderStyle: "dashed",
  },
  legendLabel: { fontSize: 11, color: "#666" },
  axisText: { fontSize: 9, color: "#ABABAB" },
  tooltipBubble: {
    backgroundColor: "#1565C0",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    elevation: 4,
  },
  tooltipText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  barTopLabel: {
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 2,
    textAlign: "center",
  },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
  },
  navBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: "#E8EEF7",
  },
  navBtnOff: { backgroundColor: "#F0F0F0" },
  navText: { fontSize: 12, color: "#1565C0", fontWeight: "600" },
  navTextOff: { color: "#CCCCCC" },
  pageInfo: { fontSize: 11, color: "#888" },
});
