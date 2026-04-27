import React from "react";
import { ScrollView, View, StyleSheet, Alert } from "react-native";
import { Text, Card, Button, Divider, useTheme } from "react-native-paper";
import { LoadingOverlay } from "../../../components/common/LoadingOverlay";
import { useReportDetail } from "../../../hooks/useReports";
import { useMarkReportRead } from "../../../hooks/useParent";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { ParentReportStackParamList } from "../../../navigation/types";

type Props = NativeStackScreenProps<
  ParentReportStackParamList,
  "ParentReportDetail"
>;

interface ContentSectionConfig {
  field: string;
  title: string;
  icon: string;
}

const CONTENT_SECTIONS: ContentSectionConfig[] = [
  { field: "activity_summary", title: "Hôm nay con làm gì?", icon: "🎯" },
  { field: "achievements", title: "Con đạt được gì hôm nay?", icon: "⭐" },
  { field: "challenges_noted", title: "Cần tiếp tục luyện tập", icon: "💪" },
  { field: "highlight_moment", title: "Khoảnh khắc đặc biệt", icon: "✨" },
  {
    field: "parent_action_guide",
    title: "Ba/Mẹ có thể làm gì ở nhà?",
    icon: "🏠",
  },
  { field: "next_session_preview", title: "Buổi tới sẽ làm gì?", icon: "📅" },
  { field: "teacher_note", title: "Lời nhắn từ cô giáo", icon: "💌" },
];

export function ParentReportDetailScreen({ route }: Props) {
  const theme = useTheme();
  const { reportId } = route.params;
  const { data: report, isLoading } = useReportDetail(reportId);
  const markRead = useMarkReportRead();

  if (isLoading || !report) return <LoadingOverlay visible />;

  const studentName = Array.isArray(report.student_id)
    ? report.student_id[1]
    : "";
  const teacherName = Array.isArray(report.teacher_id)
    ? report.teacher_id[1]
    : "";
  const durationMin = Math.round((report.session_duration || 0) * 60);
  const isUnread = report.status === "sent";

  const handleMarkRead = async () => {
    try {
      await markRead.mutateAsync(reportId);
    } catch {
      Alert.alert("Lỗi", "Không thể đánh dấu đã đọc");
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.container}
    >
      {/* Header card */}
      <Card style={styles.headerCard} mode="outlined">
        <Card.Content>
          <Text variant="titleMedium" style={{ fontWeight: "700" }}>
            {studentName}
          </Text>
          <Text variant="bodySmall" style={{ color: "#757575" }}>
            {formatReportDate(report.report_date)}
          </Text>
          <Text variant="bodySmall" style={{ color: "#757575" }}>
            Giáo viên: {teacherName}
          </Text>
          <Text variant="bodySmall" style={{ color: "#757575" }}>
            Thời lượng: {durationMin} phút
          </Text>
          <Text
            variant="bodySmall"
            style={{ color: isUnread ? "#1976D2" : "#2E7D32", marginTop: 4 }}
          >
            {isUnread ? "🔵 Chưa đọc" : "✅ Đã đọc"}
          </Text>
        </Card.Content>
      </Card>

      <Divider style={{ marginVertical: 16 }} />

      {/* Content sections — parent-friendly */}
      {CONTENT_SECTIONS.map((section) => {
        const content = (report as any)[section.field];
        if (!content) return null;

        return (
          <View key={section.field} style={styles.section}>
            <Text variant="titleSmall" style={styles.sectionTitle}>
              {section.icon} {section.title}
            </Text>
            <Text variant="bodyMedium" style={styles.sectionContent}>
              {content}
            </Text>
            <Divider style={{ marginTop: 16 }} />
          </View>
        );
      })}

      {/* Mark as read button */}
      {isUnread && (
        <Button
          mode="contained"
          icon="check"
          onPress={handleMarkRead}
          loading={markRead.isPending}
          style={styles.readButton}
        >
          Tôi đã đọc báo cáo này
        </Button>
      )}

      {/* Already read notice */}
      {report.status === "read" && (
        <Text variant="bodySmall" style={styles.readNotice}>
          ✅ Bạn đã đọc báo cáo này
        </Text>
      )}
    </ScrollView>
  );
}

function formatReportDate(dateStr: string | false): string {
  if (!dateStr) return "—";
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
  return `${days[d.getDay()]}, ${dd}/${mm}/${d.getFullYear()}`;
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  headerCard: { borderRadius: 12 },
  section: { marginBottom: 16 },
  sectionTitle: { fontWeight: "700", marginBottom: 8 },
  sectionContent: { lineHeight: 24 },
  readButton: { marginTop: 24, borderRadius: 8 },
  readNotice: { textAlign: "center", marginTop: 24, color: "#757575" },
});
