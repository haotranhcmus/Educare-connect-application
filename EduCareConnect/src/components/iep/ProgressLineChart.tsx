import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Dimensions,
} from "react-native";
import { LineChart } from "react-native-gifted-charts";
import { theme } from "../../theme";

// ── Constants ──────────────────────────────────────────────────────────────
const CHART_H = 160;
const DAYS_PER_PAGE = 7;

const Y_LABEL_W = 36;
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
  accuracy_pct: number;
  prompt_level_used?: string | false;
}

interface ProgressLineChartProps {
  results: ResultPoint[];
  targetAccuracy?: number;
  baselineAccuracy?: number;
  primaryColor?: string;
  targetColor?: string;
}

// ── Component ──────────────────────────────────────────────────────────────
export function ProgressLineChart({
  results,
  targetAccuracy,
  baselineAccuracy,
  primaryColor = "#1565C0",
  targetColor = "#4CAF50",
}: ProgressLineChartProps) {
  const byDate = useMemo(() => {
    const map = new Map<string, number[]>();
    for (const r of results) {
      if (!r.session_date) continue;
      if (!map.has(r.session_date)) map.set(r.session_date, []);
      map.get(r.session_date)!.push(r.accuracy_pct);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, vals]) => ({
        date,
        acc: Math.round(vals.reduce((s, v) => s + v, 0) / vals.length),
      }));
  }, [results]);

  const totalDays = byDate.length;

  // startIndex = index of the first day shown in the sliding window.
  // Default: show the most recent DAYS_PER_PAGE days.
  const [startIndex, setStartIndex] = useState(() =>
    Math.max(0, totalDays - DAYS_PER_PAGE),
  );

  const safeStart = Math.max(0, Math.min(startIndex, totalDays - 1));
  const pageData = byDate.slice(safeStart, safeStart + DAYS_PER_PAGE);

  // Buttons enabled/disabled
  const hasPrev = safeStart > 0;
  const hasNext = safeStart + DAYS_PER_PAGE < totalDays;

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const spacing = spacingForN(pageData.length) - 3;

  // gifted-charts draws reference lines across the full `width`.
  // Pass the exact data-area width so dashes don't overflow the gutters.
  const dataAreaW =
    pageData.length > 1
      ? INITIAL_SPACING + spacing * (pageData.length - 1) + END_SPACING
      : PLOT_W;

  const chartData = pageData.map((p, i) => ({
    value: p.acc,
    label: fmtDate(p.date),
    ...(selectedIndex === i
      ? {
          dataPointLabelComponent: () => (
            <View style={styles.tooltipBubble}>
              <Text style={styles.tooltipText}>{p.acc}%</Text>
            </View>
          ),
          dataPointLabelShiftY: -28,
          dataPointLabelShiftX: -6,
        }
      : {}),
  }));

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

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <View style={styles.wrapper}>
      {/* ── Legend ── */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: primaryColor }]} />
          <Text style={styles.legendLabel}>Độ chính xác</Text>
        </View>
        {targetAccuracy != null && (
          <View style={styles.legendItem}>
            <View style={[styles.legendDash, { borderColor: targetColor }]} />
            <Text style={styles.legendLabel}>Mục tiêu {targetAccuracy}%</Text>
          </View>
        )}
        {baselineAccuracy != null && (
          <View style={styles.legendItem}>
            <View
              style={[styles.legendDash, { borderColor: theme.colors.error }]}
            />
            <Text style={styles.legendLabel}>Ban đầu {baselineAccuracy}%</Text>
          </View>
        )}
      </View>

      {/* overflow:hidden clips any reference-line overshoot at the card edges */}
      <TouchableWithoutFeedback onPress={() => setSelectedIndex(null)}>
        <View style={styles.chartClip}>
          <LineChart
            key={`${safeStart}-${selectedIndex}`}
            data={chartData}
            width={dataAreaW}
            height={CHART_H}
            // Y-axis
            maxValue={100}
            noOfSections={4}
            stepValue={25}
            yAxisTextStyle={styles.axisText}
            // X-axis
            xAxisLabelTextStyle={styles.axisText}
            // Spacing
            initialSpacing={INITIAL_SPACING}
            endSpacing={END_SPACING}
            spacing={spacing}
            // Line
            color={primaryColor}
            thickness={2.5}
            // Dots — always visible
            hideDataPoints={false}
            dataPointsColor={primaryColor}
            dataPointsRadius={5}
            // Tap to show/hide label
            onPress={(item: any, index: number) => {
              setSelectedIndex((prev) => (prev === index ? null : index));
            }}
            // Focus ring on tapped dot
            focusEnabled
            // showDataPointOnFocus
            focusedDataPointColor={primaryColor}
            focusedDataPointRadius={8}
            showStripOnFocus
            stripWidth={1}
            stripColor="rgba(21,101,192,0.20)"
            showTextOnFocus={false}
            // Animation
            isAnimated
            animationDuration={400}
            // Grid
            rulesColor="#EEEEEE"
            rulesType="solid"
            // Reference lines — constrained to dataAreaW, won't overflow
            showReferenceLine1={targetAccuracy != null}
            referenceLine1Position={targetAccuracy ?? 0}
            referenceLine1Config={{
              color: targetColor,
              dashWidth: 5,
              dashGap: 4,
              thickness: 1.5,
              type: "dashed",
            }}
            showReferenceLine2={baselineAccuracy != null}
            referenceLine2Position={baselineAccuracy ?? 0}
            referenceLine2Config={{
              color: "#FF7043",
              dashWidth: 5,
              dashGap: 4,
              thickness: 1.5,
              type: "dashed",
            }}
          />
        </View>
      </TouchableWithoutFeedback>

      {/* ── Pagination — slides 1 day at a time ── */}
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
    // shadowColor: "#000",
    // shadowOpacity: 0.05,
    // shadowRadius: 6,
    // shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  // Clips reference lines / dots that render outside the card boundary.
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
    // shadowColor: "#000",
    // shadowOpacity: 0.18,
    // shadowRadius: 4,
    // shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  tooltipText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
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
