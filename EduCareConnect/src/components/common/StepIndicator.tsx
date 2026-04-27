import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, useTheme } from "react-native-paper";

interface StepIndicatorProps {
  steps: string[];
  currentStep: number; // 0-indexed
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  const theme = useTheme();

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
  container: { paddingVertical: 12, paddingHorizontal: 16 },
  lineContainer: { flexDirection: "row", alignItems: "center" },
  dot: { width: 12, height: 12, borderRadius: 6 },
  line: { flex: 1, height: 2 },
  labels: { flexDirection: "row", marginTop: 4 },
});
