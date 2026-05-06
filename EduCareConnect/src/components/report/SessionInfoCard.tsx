import React from "react";
import { View, StyleSheet } from "react-native";
import { Card, Text, useTheme } from "react-native-paper";

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
        <Text variant="titleSmall" style={{ marginBottom: 8 }}>
          ▼ Thông tin tự động điền
        </Text>
        <InfoRow label="Học sinh" value={studentName} />
        <InfoRow label="Ngày báo cáo" value={reportDate} />
        <InfoRow label="Thời lượng" value={`${durationMinutes} phút`} />
        {performance && <InfoRow label="Kết quả tổng" value={performance} />}

        {objectives.length > 0 && (
          <View style={{ marginTop: 8 }}>
            <Text variant="bodySmall" style={{ fontWeight: "600" }}>
              Mục tiêu đã thực hành:
            </Text>
            {objectives.map((obj, i) => (
              <Text key={i} variant="bodySmall" style={{ marginLeft: 8 }}>
                · {obj.name}: {Math.round(obj.accuracy)}%
              </Text>
            ))}
          </View>
        )}

        {avgAccuracy > 0 && (
          <Text variant="bodySmall" style={{ marginTop: 4, fontWeight: "600" }}>
            Độ chính xác TB: {Math.round(avgAccuracy)}%
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

const styles = StyleSheet.create({
  card: { marginBottom: 16 },
  row: { flexDirection: "row", marginBottom: 4 },
});
