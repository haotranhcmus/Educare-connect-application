import React from "react"
import {View, StyleSheet} from "react-native"
import {Text, useTheme} from "react-native-paper"

interface ProgressBarProps {
    progress: number;
    showPercent?: boolean;
    baseline?: number;
    target?: number;
    label?:string;
    size?: "small" | "medium";
}

export function ProgressBar({
  progress,
  showPercent = true,
  baseline,
  target,
  label,
  size = "medium",
}: ProgressBarProps) {
  const theme = useTheme();
  const clampedProgress = Math.min(100, Math.max(0, progress));
  const barHeight = size === "small" ? 6 : 10;

  // Color based on progress
const getBarColor = () => {
  if (clampedProgress >= 90) return "#41b84a";
  if (clampedProgress >= 75) return "#1565C0";
  if (clampedProgress >= 50) return "#F9A825";
  if (clampedProgress >= 25) return "#EF6C00";
  return "#C62828"; // đỏ
};

  return (
    <View style={styles.container}>
      {(label || showPercent) && (
        <View style={styles.header}>
          {label && (
            <Text
              variant="bodySmall"
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              {label}
            </Text>
          )}
          {showPercent && (
            <Text
              variant="labelMedium"
              style={{ color: theme.colors.onSurface, fontWeight: "600" }}
            >
              {Math.round(clampedProgress)}%
            </Text>
          )}
        </View>
      )}

      <View
        style={[
          styles.track,
          { height: barHeight, backgroundColor: theme.colors.surfaceVariant },
        ]}
      >
        <View
          style={[
            styles.fill,
            {
              width: `${clampedProgress}%`,
              height: barHeight,
              backgroundColor: getBarColor(),
            },
          ]}
        />

        {/* Baseline marker */}
        {baseline !== undefined && (
          <View
            style={[
              styles.marker,
              {
                left: `${Math.min(100, baseline)}%`,
                backgroundColor: "#757575",
              },
            ]}
          />
        )}

        {/* Target marker */}
        {target !== undefined && (
          <View
            style={[
              styles.marker,
              { left: `${Math.min(100, target)}%`, backgroundColor: "#1565C0" },
            ]}
          />
        )}
      </View>

      {/* Legend for baseline/target */}
      {(baseline !== undefined || target !== undefined) && (
        <View style={styles.legend}>
          {baseline !== undefined && (
            <View style={styles.legendItem}>
              <View
                style={[styles.legendDot, { backgroundColor: "#757575" }]}
              />
              <Text
                variant="labelSmall"
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                Baseline {baseline}%
              </Text>
            </View>
          )}
          {target !== undefined && (
            <View style={styles.legendItem}>
              <View
                style={[styles.legendDot, { backgroundColor: "#1565C0" }]}
              />
              <Text
                variant="labelSmall"
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                Target {target}%
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: "100%" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  track: { borderRadius: 5, overflow: "hidden", position: "relative" },
  fill: { borderRadius: 5 },
  marker: {
    position: "absolute",
    top: -2,
    width: 2,
    height: 14,
    borderRadius: 1,
  },
  legend: { flexDirection: "row", marginTop: 4, gap: 12 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
});