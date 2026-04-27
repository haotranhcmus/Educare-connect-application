import React from "react";
import { TouchableOpacity, View, StyleSheet } from "react-native";
import { Text, useTheme } from "react-native-paper";

interface ParentReportCardProps {
  report: any;
  onPress: () => void;
}

export function ParentReportCard({ report, onPress }: ParentReportCardProps) {
  const theme = useTheme();
  const isUnread = report.status === "sent";
  const teacherName = Array.isArray(report.teacher_id)
    ? report.teacher_id[1]
    : "";
  const preview = report.activity_summary
    ? report.activity_summary.substring(0, 60) +
      (report.activity_summary.length > 60 ? "..." : "")
    : "";

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: isUnread ? "#E3F2FD" : theme.colors.surface,
          borderLeftColor: isUnread ? "#1976D2" : "transparent",
          borderLeftWidth: isUnread ? 3 : 0,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.row}>
        <Text variant="bodyMedium" style={{ fontWeight: "600" }}>
          {isUnread ? "🔵" : "✅"} {formatReportDate(report.report_date)}
        </Text>
        <Text
          variant="bodySmall"
          style={{ color: isUnread ? "#1976D2" : "#2E7D32" }}
        >
          {isUnread ? "🔵 Mới" : "✅ Đã đọc"}
        </Text>
      </View>
      <Text variant="bodySmall" style={{ color: "#757575" }}>
        {report.name}
      </Text>
      {preview ? (
        <Text variant="bodySmall" style={{ marginTop: 4 }}>
          {preview}
        </Text>
      ) : null}
      <Text variant="bodySmall" style={{ color: "#757575", marginTop: 4 }}>
        Giáo viên: {teacherName}
      </Text>
    </TouchableOpacity>
  );
}

function formatReportDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const days = [
    "Chủ Nhật",
    "Thứ Hai",
    "Thứ Ba",
    "Thứ Tư",
    "Thứ Năm",
    "Thứ Sáu",
    "Thứ Bảy",
  ];
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}  ${days[d.getDay()]}`;
}

const styles = StyleSheet.create({
  card: { padding: 16, borderRadius: 12, marginBottom: 8, elevation: 1 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});
