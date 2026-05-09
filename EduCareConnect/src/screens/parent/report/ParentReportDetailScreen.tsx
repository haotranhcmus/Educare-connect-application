import React from "react";
import { ScrollView, View, StyleSheet, Alert } from "react-native";
import { Text, Button, Divider, useTheme, Surface } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LoadingOverlay } from "../../../components/common/LoadingOverlay";
import { useReportDetail } from "../../../hooks/useReports";
import { useMarkReportRead } from "../../../hooks/useParent";
import { useSessionDetail } from "../../../hooks/useSessions";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { ParentReportStackParamList } from "../../../navigation/types";

type Props = NativeStackScreenProps<
  ParentReportStackParamList,
  "ParentReportDetail"
>;

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; icon: string }
> = {
  draft: {
    label: "Nháp",
    color: "#757575",
    bg: "#F5F5F5",
    icon: "file-outline",
  },
  sent: {
    label: "Đã gửi",
    color: "#1565C0",
    bg: "#E3F2FD",
    icon: "send-check",
  },
  read: { label: "Đã đọc", color: "#2E7D32", bg: "#E8F5E9", icon: "eye-check" },
};

const PERF_CONFIG: Record<
  string,
  { label: string; color: string; icon: string }
> = {
  excellent: { label: "Xuất sắc", color: "#1B5E20", icon: "star" },
  good: { label: "Tốt", color: "#1565C0", icon: "thumb-up" },
  average: { label: "Trung bình", color: "#E65100", icon: "minus-circle" },
  needs_support: { label: "Cần hỗ trợ", color: "#B71C1C", icon: "heart-pulse" },
};

const OBS_LABELS = {
  attendance: { present: "Có mặt", absent: "Vắng", late: "Đi trễ" },
  mood: {
    happy: "Vui vẻ",
    calm: "Bình tĩnh",
    anxious: "Lo lắng",
    upset: "Khó chịu",
    good: "Tốt",
  },
  energy_level: { high: "Cao", normal: "Bình thường", low: "Thấp" },
  engagement_level: {
    engaged: "Tập trung",
    highly_engaged: "Rất tập trung",
    somewhat_engaged: "Khá tập trung",
    disengaged: "Mất tập trung",
  },
} as const;

// ENGAGEMENT_LEVELS = [
//     ("highly_engaged", "Rất tập trung"),
//     ("engaged", "Tập trung"),
//     ("somewhat_engaged", "Khá tập trung"),
//     ("disengaged", "Mất tập trung"),
// ]

const CONTENT_FIELDS: {
  key: string;
  label: string;
  icon: string;
  color: string;
}[] = [
  {
    key: "activity_summary",
    label: "Tóm tắt hoạt động",
    icon: "clipboard-text",
    color: "#1565C0",
  },
  {
    key: "achievements",
    label: "Thành tích nổi bật",
    icon: "star-outline",
    color: "#F9A825",
  },
  {
    key: "challenges_noted",
    label: "Điểm cần tiếp tục hỗ trợ",
    icon: "lightbulb-on-outline",
    color: "#E65100",
  },
  {
    key: "highlight_moment",
    label: "Khoảnh khắc đáng nhớ",
    icon: "heart-outline",
    color: "#C62828",
  },
  {
    key: "parent_action_guide",
    label: "Hướng dẫn luyện tập tại nhà",
    icon: "home-heart",
    color: "#2E7D32",
  },
  {
    key: "next_session_preview",
    label: "Nội dung buổi học tới",
    icon: "calendar-arrow-right",
    color: "#6A1B9A",
  },
];

export function ParentReportDetailScreen({ route }: Props) {
  const theme = useTheme();
  const { reportId } = route.params;
  const { data: report, isLoading } = useReportDetail(reportId);
  const sessionId = Array.isArray(report?.session_log_id)
    ? report.session_log_id[0]
    : 0;
  const { data: session } = useSessionDetail(sessionId);
  const markRead = useMarkReportRead();

  if (isLoading || !report) return <LoadingOverlay visible />;

  const statusCfg = STATUS_CONFIG[report.status] ?? STATUS_CONFIG.draft;
  const isUnread = report.status === "sent";
  const studentName = Array.isArray(report.student_id)
    ? report.student_id[1]
    : "";
  const teacherName = Array.isArray(report.teacher_id)
    ? report.teacher_id[1]
    : "";
  const durationMin = Math.round((report.session_duration || 0) * 60);
  const perfCfg = report.overall_performance
    ? PERF_CONFIG[report.overall_performance]
    : null;

  const handleMarkRead = async () => {
    try {
      await markRead.mutateAsync(report.id);
    } catch {
      Alert.alert("Lỗi", "Không thể đánh dấu đã đọc");
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.container}
    >
      <Surface
        style={[
          styles.heroCard,
          { backgroundColor: theme.colors.primaryContainer },
        ]}
        elevation={0}
      >
        <View style={styles.heroTop}>
          <MaterialCommunityIcons
            name="file-document-outline"
            size={36}
            color={theme.colors.primary}
          />
          <View style={styles.heroInfo}>
            <Text
              variant="titleMedium"
              style={{
                fontWeight: "700",
                color: theme.colors.onPrimaryContainer,
              }}
              numberOfLines={2}
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
        <View style={styles.heroBadgeRow}>
          <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}>
            <MaterialCommunityIcons
              name={statusCfg.icon as any}
              size={13}
              color={statusCfg.color}
            />
            <Text style={[styles.statusText, { color: statusCfg.color }]}>
              {statusCfg.label}
            </Text>
          </View>
          {perfCfg && (
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: `${perfCfg.color}18` },
              ]}
            >
              <MaterialCommunityIcons
                name={perfCfg.icon as any}
                size={13}
                color={perfCfg.color}
              />
              <Text style={[styles.statusText, { color: perfCfg.color }]}>
                {perfCfg.label}
              </Text>
            </View>
          )}
        </View>
      </Surface>

      <SectionLabel
        icon="calendar-clock"
        title="Thông Tin Buổi Học"
        theme={theme}
      />
      <Surface style={styles.infoCard} elevation={1}>
        <InfoRow icon="account" label="Học sinh" value={studentName} />
        <Divider style={styles.rowDivider} />
        <InfoRow
          icon="calendar-today"
          label="Ngày báo cáo"
          value={formatDate(report.report_date)}
        />
        <Divider style={styles.rowDivider} />
        <InfoRow icon="account-tie" label="Giáo viên" value={teacherName} />
        <Divider style={styles.rowDivider} />
        <InfoRow
          icon="clock-outline"
          label="Thời lượng"
          value={durationMin > 0 ? `${durationMin} phút` : "—"}
        />
        {(session?.attendance || session?.mood || session?.energy_level) && (
          <>
            <Divider style={styles.rowDivider} />
            <InfoRow
              icon="check-decagram-outline"
              label="Điểm danh"
              value={labelOf("attendance", session?.attendance)}
            />
            <Divider style={styles.rowDivider} />
            <InfoRow
              icon="emoticon-outline"
              label="Tâm trạng"
              value={labelOf("mood", session?.mood)}
            />
            <Divider style={styles.rowDivider} />
            <InfoRow
              icon="flash-outline"
              label="Năng lượng"
              value={labelOf("energy_level", session?.energy_level)}
            />
          </>
        )}
        {session?.engagement_level ? (
          <>
            <Divider style={styles.rowDivider} />
            <InfoRow
              icon="account-heart-outline"
              label="Mức tập trung"
              value={labelOf("engagement_level", session?.engagement_level)}
            />
          </>
        ) : null}
        {report.objectives_worked ? (
          <>
            <Divider style={styles.rowDivider} />
            <InfoRow
              icon="target"
              label="Mục tiêu"
              value={report.objectives_worked}
            />
          </>
        ) : null}
        {report.accuracy_summary ? (
          <>
            <Divider style={styles.rowDivider} />
            <InfoRow
              icon="percent"
              label="Độ chính xác"
              value={report.accuracy_summary}
            />
          </>
        ) : null}
      </Surface>

      {(report.status === "sent" || report.status === "read") &&
      report.write_date ? (
        <Surface
          style={[
            styles.sentBanner,
            { backgroundColor: statusCfg.bg, borderColor: statusCfg.color },
          ]}
          elevation={0}
        >
          <MaterialCommunityIcons
            name={statusCfg.icon as any}
            size={16}
            color={statusCfg.color}
          />
          <Text style={[styles.sentBannerText, { color: statusCfg.color }]}>
            {report.status === "read" ? "Bạn đã đọc • " : "Đã gửi • "}
            {formatDateTime(report.write_date)}
          </Text>
        </Surface>
      ) : null}

      <SectionLabel
        icon="file-document-edit-outline"
        title="Nội Dung Báo Cáo"
        theme={theme}
      />
      {CONTENT_FIELDS.map((field) => {
        const value = (report as any)[field.key];
        if (!value) return null;
        return (
          <Surface key={field.key} style={styles.contentCard} elevation={1}>
            <View style={styles.contentCardHeader}>
              <View
                style={[
                  styles.iconBubble,
                  { backgroundColor: `${field.color}18` },
                ]}
              >
                <MaterialCommunityIcons
                  name={field.icon as any}
                  size={16}
                  color={field.color}
                />
              </View>
              <Text
                variant="labelMedium"
                style={[styles.contentLabel, { color: field.color }]}
              >
                {field.label}
              </Text>
            </View>
            <Text
              variant="bodyMedium"
              style={[styles.contentBody, { color: theme.colors.onSurface }]}
            >
              {value}
            </Text>
          </Surface>
        );
      })}

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
    </ScrollView>
  );
}

function SectionLabel({
  icon,
  title,
  theme,
}: {
  icon: string;
  title: string;
  theme: any;
}) {
  return (
    <View style={styles.sectionLabel}>
      <MaterialCommunityIcons
        name={icon as any}
        size={16}
        color={theme.colors.primary}
      />
      <Text
        variant="labelLarge"
        style={{ fontWeight: "700", color: theme.colors.primary }}
      >
        {title}
      </Text>
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  const theme = useTheme();
  return (
    <View style={styles.infoRow}>
      <MaterialCommunityIcons
        name={icon as any}
        size={16}
        color={theme.colors.outline}
        style={{ marginRight: 8, marginTop: 1 }}
      />
      <Text
        variant="bodySmall"
        style={{ color: theme.colors.outline, width: 100 }}
      >
        {label}
      </Text>
      <Text variant="bodyMedium" style={{ flex: 1, fontWeight: "500" }}>
        {value}
      </Text>
    </View>
  );
}

function labelOf(
  field: keyof typeof OBS_LABELS,
  value: string | undefined,
): string {
  if (!value) return "—";
  const labels = OBS_LABELS[field] as Record<string, string>;
  return labels[value] || value;
}

function formatDate(dateStr: string | false): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr + "T00:00:00");
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

function formatDateTime(dtStr: string): string {
  if (!dtStr) return "";
  const d = new Date(dtStr);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 48 },
  heroCard: { borderRadius: 16, padding: 16, marginBottom: 20 },
  heroTop: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  heroInfo: { flex: 1 },
  heroBadgeRow: { flexDirection: "row", gap: 8, marginTop: 12 },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: { fontSize: 12, fontWeight: "600" },
  sectionLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
    marginTop: 4,
  },
  infoCard: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 20,
    backgroundColor: "#FAFAFA",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 10,
    backgroundColor: "#fff",
  },
  rowDivider: { marginHorizontal: -14 },
  sentBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 20,
  },
  sentBannerText: { fontSize: 13, fontWeight: "500" },
  contentCard: { borderRadius: 12, padding: 14, marginBottom: 10 },
  contentCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  iconBubble: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  contentLabel: { fontWeight: "700", flex: 1 },
  contentBody: { lineHeight: 22 },
  readButton: { marginTop: 12, borderRadius: 10 },
});
