import React from "react";
import { View, StyleSheet } from "react-native";
import { Card, Text, useTheme, ProgressBar } from "react-native-paper";

interface Objective {
  name: string;
  accuracy: number;
}

interface SessionInfoCardProps {
  studentName: string;
  reportDate: string; // "07/04/2026"
  durationMinutes: number;
  performance: string | null; // "Xuất sắc" etc.
  objectives: Objective[];
  avgAccuracy: number;
}

export function SessionInfoCard({
  studentName,
  reportDate,
  durationMinutes,
  performance,
  objectives,
  avgAccuracy,
}: SessionInfoCardProps) {
  const theme = useTheme();

  return (
    <Card style={styles.card} mode="outlined">
      <Card.Content>
        <InfoRow label="Học sinh" value={studentName} />
        <InfoRow label="Ngày báo cáo" value={reportDate} />
        <InfoRow label="Thời lượng" value={`${durationMinutes} phút`} />
        {performance && <InfoRow label="Kết quả tổng" value={performance} />}

        {objectives.length > 0 && (
          <View style={styles.objectivesSection}>
            <Text
              variant="bodySmall"
              style={{ fontWeight: "600", marginBottom: 10 }}
            >
              Mục tiêu đã thực hành:
            </Text>
            <View style={styles.objectivesContainer}>
              {objectives.map((obj, i) => (
                <ObjectiveItem
                  key={i}
                  name={obj.name}
                  accuracy={obj.accuracy}
                  theme={theme}
                />
              ))}
            </View>
          </View>
        )}

        {avgAccuracy > 0 && (
          <Text variant="bodySmall" style={{ marginTop: 4, fontWeight: "600" }}>
            Độ chính xác trung bình: {Math.round(avgAccuracy)}%
          </Text>
        )}
      </Card.Content>
    </Card>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text variant="bodySmall" style={{ color: "#757575", width: 110 }}>
        {label}:
      </Text>
      <Text variant="bodyMedium" style={{ flex: 1 }}>
        {value}
      </Text>
    </View>
  );
}

function ObjectiveItem({
  name,
  accuracy,
  theme,
}: {
  name: string;
  accuracy: number;
  theme: any;
}) {
  const acc = Math.round(accuracy);
  const progress = accuracy / 100;

  // Color based on accuracy
  let progressColor = theme.colors.error; // red < 50
  if (accuracy >= 80)
    progressColor = theme.colors.primary; // green >= 80
  else if (accuracy >= 50) progressColor = "#E67E22"; // orange 50-80

  return (
    <View style={styles.objectiveItem}>
      <View style={styles.objectiveHeader}>
        <Text
          variant="bodySmall"
          style={[styles.objectiveName, { color: theme.colors.onSurface }]}
          numberOfLines={2}
        >
          {name}
        </Text>
        <Text
          variant="labelSmall"
          style={[styles.accuracyLabel, { color: progressColor }]}
        >
          {acc}%
        </Text>
      </View>
      <ProgressBar
        progress={progress}
        color={progressColor}
        style={styles.progressBar}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 16 },
  row: { flexDirection: "row", marginBottom: 4 },
  objectivesSection: {
    marginTop: 12,
  },
  objectivesContainer: {
    gap: 10,
  },
  objectiveItem: {
    gap: 6,
    paddingHorizontal: 1,
  },
  objectiveHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  objectiveName: {
    flex: 1,
    fontWeight: "500",
  },
  accuracyLabel: {
    fontWeight: "700",
    fontSize: 12,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
});
