import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, useTheme } from "react-native-paper";

interface StepIndicatorProps {
  steps: string[];
  currentStep: number; // 0-indexed
  /** When provided, renders an objective progress bar instead of step dots */
  objectiveIndex?: number;
  /** Total number of objectives */
  totalObjectives?: number;
}

export function StepIndicator({
  steps,
  currentStep,
  objectiveIndex,
  totalObjectives,
}: StepIndicatorProps) {
  const theme = useTheme();

  // ── Objective progress mode ──────────────────────────
  if (
    objectiveIndex !== undefined &&
    totalObjectives !== undefined &&
    totalObjectives > 0
  ) {
    const completed = objectiveIndex + 1; // objectives already saved (0-indexed current)
    const progress = completed / totalObjectives;
    const isAllDone = completed >= totalObjectives;

    return (
      <View
        style={[
          styles.progressContainer,
          { borderBottomColor: theme.colors.outlineVariant },
        ]}
      >
        <View style={styles.progressLabelRow}>
          <Text
            variant="labelSmall"
            style={{ color: theme.colors.onSurfaceVariant, fontWeight: "500" }}
          >
            {`Mục tiêu ${objectiveIndex + 1} / ${totalObjectives}`}
          </Text>
        </View>

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
                width: `${Math.round(progress * 100)}%`,
                backgroundColor: theme.colors.primary,
              },
            ]}
          />
        </View>
      </View>
    );
  }

  // ── Classic step dots mode ───────────────────────────
  return (
    <View style={styles.container}>
      <View style={styles.lineContainer}>
        {steps.map((_, i) => (
          <React.Fragment key={i}>
            <View
              style={[
                styles.dot,
                {
                  backgroundColor:
                    i <= currentStep
                      ? theme.colors.primary
                      : theme.colors.outlineVariant,
                },
              ]}
            />
            {i < steps.length - 1 && (
              <View
                style={[
                  styles.line,
                  {
                    backgroundColor:
                      i < currentStep
                        ? theme.colors.primary
                        : theme.colors.outlineVariant,
                  },
                ]}
              />
            )}
          </React.Fragment>
        ))}
      </View>
      <View style={styles.labels}>
        {steps.map((label, i) => (
          <Text
            key={i}
            variant="labelSmall"
            style={{
              color:
                i <= currentStep ? theme.colors.primary : theme.colors.outline,
              fontWeight: i === currentStep ? "700" : "400",
              flex: 1,
              textAlign: "center",
            }}
          >
            {label}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Classic mode
  container: { paddingVertical: 12, paddingHorizontal: 16 },
  lineContainer: { flexDirection: "row", alignItems: "center" },
  dot: { width: 12, height: 12, borderRadius: 6 },
  line: { flex: 1, height: 2 },
  labels: { flexDirection: "row", marginTop: 4 },

  // Objective progress mode
  progressContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    gap: 8,
    borderBottomWidth: 1,
  },
  progressLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
});
