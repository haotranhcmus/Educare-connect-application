import React from "react";
import { ScrollView, View, StyleSheet, Alert } from "react-native";
import { Text, Button, Divider, Card, useTheme } from "react-native-paper";
import { StatusBadge } from "../../../components/common/StatusBadge";
import { ContentSection } from "../../../components/report/ContentSection";
import { SentInfoBanner } from "../../../components/report/SentInfoBanner";
import { LoadingOverlay } from "../../../components/common/LoadingOverlay";
import { useReportDetail, useSendReport } from "../../../hooks/useReports";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { ReportStackParamList } from "../../../navigation/types";

type Props = NativeStackScreenProps<ReportStackParamList, "ReportDetail">;

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  draft: { label: "Nháp", color: "#9E9E9E" },
  sent: { label: "Đã gửi", color: "#1976D2" },
  read: { label: "PH đã đọc", color: "#2E7D32" },
};

const PERF_LABELS: Record<string, string> = {
  excellent: "Xuất sắc",
  good: "Tốt",
  average: "Trung bình",
  needs_support: "Cần hỗ trợ",
};

export function ReportDetailScreen({ navigation, route }: Props) {
  const theme = useTheme();
  const { reportId } = route.params;
  const { data: report, isLoading } = useReportDetail(reportId);
  const sendReport = useSendReport();

  if (isLoading || !report) return <LoadingOverlay visible />;

  const statusCfg = STATUS_CONFIG[report.status] || STATUS_CONFIG.draft;
  const isDraft = report.status === "draft";
  const isSentOrRead = report.status === "sent" || report.status === "read";
  const studentName = Array.isArray(report.student_id)
    ? report.student_id[1]
    : "";
  const durationMin = Math.round((report.session_duration || 0) * 60);
  const perfLabel = report.overall_performance
    ? PERF_LABELS[report.overall_performance] || report.overall_performance
    : null;

  const handleEdit = () => {
    navigation.navigate("ReportCreate", {
      reportId: report.id,
      sessionId: Array.isArray(report.session_log_id)
        ? report.session_log_id[0]
        : undefined,
    });
  };

  const handleSend = () => {
    Alert.alert(
      "Xác nhận gửi",
      "Báo cáo sẽ được gửi đến phụ huynh qua email. Bạn có chắc?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Gửi",
          onPress: async () => {
            try {
              await sendReport.mutateAsync(report.id);
              // Refetch will update the status
            } catch {
              Alert.alert("Lỗi", "Không thể gửi báo cáo");
            }
          },
        },
      ],
    );
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.container}
    >
      {/* ── Header ─────────────────────────────────────── */}
      <Text variant="titleMedium">{report.name}</Text>
      <StatusBadge status={report.status} label={statusCfg.label} />

      {/* ── Sent/Read Info Banner ──────────────────────── */}
      {isSentOrRead && (
        <SentInfoBanner
          status={report.status as "sent" | "read"}
          sentAt={(report as any).write_date}
          recipientEmail={(report as any).parent_email}
        />
      )}

      {/* ── Session Info Section ───────────────────────── */}
      <Text variant="titleSmall" style={styles.sectionHeader}>
        ━━━ Thông Tin Buổi Học ━━━
      </Text>
      <Card mode="outlined" style={{ marginBottom: 16 }}>
        <Card.Content>
          <InfoRow label="Học sinh" value={studentName} />
          <InfoRow
            label="Ngày báo cáo"
            value={formatDate(report.report_date)}
          />
          <InfoRow label="Thời lượng" value={`${durationMin} phút`} />
          {perfLabel && <InfoRow label="Kết quả TC" value={perfLabel} />}

          {report.objectives_worked && (
            <View style={{ marginTop: 8 }}>
              <Text variant="bodySmall" style={{ fontWeight: "600" }}>
                Mục tiêu thực hành:
              </Text>
              <Text variant="bodySmall">{report.objectives_worked}</Text>
            </View>
          )}
          {report.accuracy_summary && (
            <Text
              variant="bodySmall"
              style={{ marginTop: 4, fontWeight: "600" }}
            >
              {report.accuracy_summary}
            </Text>
          )}
        </Card.Content>
      </Card>

      {/* ── Content Sections ───────────────────────────── */}
      <Text variant="titleSmall" style={styles.sectionHeader}>
        ━━━ Nội Dung Báo Cáo ━━━
      </Text>

      <ContentSection
        title="Tóm tắt hoạt động"
        content={report.activity_summary ?? false}
      />
      <ContentSection
        title="Thành tích nổi bật"
        content={report.achievements ?? false}
      />
      <ContentSection
        title="Điểm cần tiếp tục hỗ trợ"
        content={report.challenges_noted ?? false}
      />
      <ContentSection
        title="Khoảnh khắc đáng nhớ"
        content={report.highlight_moment ?? false}
        icon="🌟"
      />
      <ContentSection
        title="Hướng dẫn cho phụ huynh tại nhà"
        content={report.parent_action_guide ?? false}
      />
      <ContentSection
        title="Xem trước buổi học tới"
        content={report.next_session_preview ?? false}
      />
      <ContentSection
        title="Ghi chú nội bộ (chỉ GV thấy)"
        content={report.teacher_note ?? false}
      />

      {/* ── Actions (draft only) ───────────────────────── */}
      {isDraft && (
        <>
          <Divider style={{ marginVertical: 16 }} />
          <Button
            mode="outlined"
            icon="pencil"
            onPress={handleEdit}
            style={{ marginBottom: 12 }}
          >
            Chỉnh sửa báo cáo
          </Button>
          <Button
            mode="contained"
            icon="email-send"
            onPress={handleSend}
            loading={sendReport.isPending}
          >
            Gửi cho phụ huynh →
          </Button>
        </>
      )}

      {/* ── Read-only notice for sent/read ─────────────── */}
      {isSentOrRead && (
        <Text
          variant="bodySmall"
          style={{ textAlign: "center", marginTop: 16, opacity: 0.5 }}
        >
          Không có hành động nào thêm
        </Text>
      )}
    </ScrollView>
  );
}

// ── Helpers ───────────────────────────────────────────────────
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text variant="bodySmall" style={{ color: "#757575", width: 110 }}>
        {label}:
      </Text>
      <Text variant="bodyMedium" style={{ flex: 1 }}>
        {value}
      </Text>
    </View>
  );
}

function formatDate(dateStr: string | false): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr + "T00:00:00");
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  sectionHeader: { fontWeight: "700", marginBottom: 12, marginTop: 8 },
  infoRow: { flexDirection: "row", marginBottom: 4 },
});
