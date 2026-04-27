import React from "react";
import { ScrollView, View, StyleSheet, Alert } from "react-native";
import { Text, Card, Button, Divider, useTheme } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LoadingOverlay } from "../../../components/common/LoadingOverlay";
import { useReportDetail } from "../../../hooks/useReports";
import { useMarkReportRead } from "../../../hooks/useParent";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { ParentReportStackParamList } from "../../../navigation/types";

type Props = NativeStackScreenProps<
  ParentReportStackParamList,
  "ParentReportDetail"
>;

const PERFORMANCE_LABEL: Record<string, string> = {
  excellent: "Xuất sắc",
  good: "Tốt",
  fair: "Khá",
  poor: "Cần cải thiện",
};

const PERFORMANCE_COLOR: Record<string, string> = {
  excellent: "#1B5E20",
  good: "#388E3C",
  fair: "#E65100",
  poor: "#B71C1C",
};

const STATUS_LABEL: Record<string, string> = {
  draft: "Nháp",
  ready: "Sẵn sàng",
  sent: "Đã gửi",
  read: "Đã đọc",
};

interface ContentSectionConfig {
  field: string;
  title: string;
  icon: string;
}

const CONTENT_SECTIONS: ContentSectionConfig[] = [
  { field: "activity_summary", title: "Hôm nay con làm gì?", icon: "target" },
  { field: "achievements", title: "Con đạt được gì hôm nay?", icon: "star" },
  {
    field: "challenges_noted",
    title: "Cần tiếp tục luyện tập",
    icon: "arm-flex",
  },
  {
    field: "highlight_moment",
    title: "Khoảnh khắc đặc biệt",
    icon: "creation",
  },
  {
    field: "parent_action_guide",
    title: "Ba/Mẹ có thể làm gì ở nhà?",
    icon: "home-outline",
  },
  {
    field: "next_session_preview",
    title: "Buổi tới sẽ làm gì?",
    icon: "calendar-outline",
  },
  {
    field: "teacher_note",
    title: "Lời nhắn từ cô giáo",
    icon: "email-outline",
  },
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
  const performance = report.overall_performance;
  const performanceBg = performance
    ? PERFORMANCE_COLOR[performance]
    : undefined;
  const performanceLabel = performance ? PERFORMANCE_LABEL[performance] : null;

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
      {/* ── Header card ── */}
      <Card
        style={[
          styles.headerCard,
          { backgroundColor: theme.colors.primaryContainer },
        ]}
        mode="contained"
      >
        <Card.Content>
          <View style={styles.headerRow}>
            <View
              style={[
                styles.iconBox,
                { backgroundColor: theme.colors.primary + "22" },
              ]}
            >
              <MaterialCommunityIcons
                name="file-document-outline"
                size={26}
                color={theme.colors.primary}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                variant="titleMedium"
                style={{
                  fontWeight: "700",
                  color: theme.colors.onPrimaryContainer,
                }}
              >
                {report.name}
              </Text>
              <Text
                variant="bodySmall"
                style={{
                  color: theme.colors.onPrimaryContainer,
                  opacity: 0.75,
                  marginTop: 2,
                }}
              >
                {studentName}
              </Text>
            </View>
          </View>

          <View style={styles.badgeRow}>
            <View
              style={[
                styles.badge,
                { backgroundColor: isUnread ? "#1565C0" : "#2E7D32" },
              ]}
            >
              <MaterialCommunityIcons
                name={isUnread ? "send" : "check-all"}
                size={12}
                color="white"
              />
              <Text
                variant="labelSmall"
                style={{ color: "white", marginLeft: 4 }}
              >
                {STATUS_LABEL[report.status] ?? report.status}
              </Text>
            </View>
            {performanceLabel && performanceBg && (
              <View style={[styles.badge, { backgroundColor: performanceBg }]}>
                <MaterialCommunityIcons
                  name="thumb-up-outline"
                  size={12}
                  color="white"
                />
                <Text
                  variant="labelSmall"
                  style={{ color: "white", marginLeft: 4 }}
                >
                  {performanceLabel}
                </Text>
              </View>
            )}
          </View>
        </Card.Content>
      </Card>

      {/* ── Thông Tin Buổi Học ── */}
      <Card style={styles.sessionCard} mode="outlined">
        <Card.Content>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons
              name="calendar-clock"
              size={18}
              color={theme.colors.primary}
              style={{ marginRight: 6 }}
            />
            <Text
              variant="titleSmall"
              style={{ fontWeight: "700", color: theme.colors.primary }}
            >
              Thông Tin Buổi Học
            </Text>
          </View>
          <Divider style={{ marginVertical: 10 }} />

          <InfoRow
            icon="account-outline"
            label="Học sinh"
            value={studentName}
          />
          <InfoRow
            icon="calendar-outline"
            label="Ngày báo cáo"
            value={formatReportDate(report.report_date)}
          />
          <InfoRow
            icon="clock-outline"
            label="Thời lượng"
            value={`${durationMin} phút`}
          />
          <InfoRow
            icon="account-tie-outline"
            label="Giáo viên"
            value={teacherName}
          />
          {report.objectives_worked ? (
            <InfoRow
              icon="target"
              label="Mục tiêu"
              value={report.objectives_worked}
              multiline
            />
          ) : null}
          {report.accuracy_summary ? (
            <InfoRow
              icon="percent-outline"
              label="Độ chính xác"
              value={report.accuracy_summary}
              multiline
            />
          ) : null}
        </Card.Content>
      </Card>

      {/* ── Content sections — parent-friendly ── */}
      {CONTENT_SECTIONS.map((section) => {
        const content = (report as any)[section.field];
        if (!content) return null;

        return (
          <View key={section.field} style={styles.section}>
            <View style={styles.contentSectionTitle}>
              <MaterialCommunityIcons
                name={section.icon as any}
                size={17}
                color={theme.colors.primary}
                style={{ marginRight: 8 }}
              />
              <Text variant="titleSmall" style={{ fontWeight: "700", flex: 1 }}>
                {section.title}
              </Text>
            </View>
            <Text variant="bodyMedium" style={styles.sectionContent}>
              {content}
            </Text>
            <Divider style={{ marginTop: 16 }} />
          </View>
        );
      })}

      {/* ── Footer status line ── */}
      {report.write_date ? (
        <View style={styles.footerRow}>
          <MaterialCommunityIcons
            name={isUnread ? "send" : "check-all"}
            size={14}
            color={isUnread ? "#1565C0" : "#2E7D32"}
          />
          <Text
            variant="labelSmall"
            style={{
              color: isUnread ? "#1565C0" : "#2E7D32",
              marginLeft: 6,
            }}
          >
            {STATUS_LABEL[report.status] ?? report.status} •{" "}
            {formatDateTime(report.write_date)}
          </Text>
        </View>
      ) : null}

      {/* ── Mark as read button ── */}
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

      {report.status === "read" && (
        <View style={styles.readNoticeRow}>
          <MaterialCommunityIcons name="check-all" size={16} color="#2E7D32" />
          <Text
            variant="bodySmall"
            style={[styles.readNotice, { marginLeft: 6 }]}
          >
            Bạn đã đọc báo cáo này
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function InfoRow({
  icon,
  label,
  value,
  multiline = false,
}: {
  icon: string;
  label: string;
  value: string;
  multiline?: boolean;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.infoRow, multiline && { alignItems: "flex-start" }]}>
      <MaterialCommunityIcons
        name={icon as any}
        size={15}
        color={theme.colors.primary}
        style={{ marginRight: 8, marginTop: multiline ? 2 : 0 }}
      />
      <Text
        variant="labelMedium"
        style={[styles.infoLabel, { color: theme.colors.outline }]}
      >
        {label}
      </Text>
      <Text
        variant="bodySmall"
        style={[styles.infoValue, { color: theme.colors.onSurface }]}
      >
        {value}
      </Text>
    </View>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatReportDate(dateStr: string | false): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr + "T00:00:00");
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
}

function formatDateTime(dtStr: string): string {
  const d = new Date(dtStr);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()} ${hh}:${min}`;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 48 },
  headerCard: { borderRadius: 16, marginBottom: 16 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  badgeRow: { flexDirection: "row", gap: 8 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  sessionCard: { borderRadius: 14, marginBottom: 16 },
  sectionHeader: { flexDirection: "row", alignItems: "center" },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  infoLabel: { width: 108, flexShrink: 0 },
  infoValue: { flex: 1, lineHeight: 20 },
  section: { marginBottom: 16 },
  sectionTitle: { fontWeight: "700", marginBottom: 8 },
  sectionContent: { lineHeight: 24 },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    marginBottom: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.04)",
  },
  readButton: { marginTop: 8, borderRadius: 8 },
  readNoticeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
  },
  readNotice: { color: "#757575" },
  contentSectionTitle: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
});
