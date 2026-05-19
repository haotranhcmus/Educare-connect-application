import React, { useEffect } from "react";
import { ScrollView, View, StyleSheet, Platform } from "react-native";
import { Text, Divider, useTheme, Surface } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { LoadingOverlay } from "../../../components/common/LoadingOverlay";
import { useReportDetail } from "../../../hooks/useReports";
import { useMarkReportRead } from "../../../hooks/useParent";
import {
  useSessionDetail,
  useSessionObjectives,
} from "../../../hooks/useSessions";
import { ObjectiveCard } from "../../../components/iep/ObjectiveCard";
import {
  REPORT_STATUS_HERO_CONFIG,
  PERFORMANCE_CONFIG,
} from "../../../theme/decorativeColors";
import { obsLabel } from "../../../utils/labels";
import { REPORT_FIELDS_PARENT } from "../../../constants/reportFields";
import { formatDate, formatDateTime } from "../../../utils/formatters";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { ParentReportStackParamList } from "../../../navigation/types";

const G1 = "#2E7D32";
const G2 = "#43A047";

type Props = NativeStackScreenProps<
  ParentReportStackParamList,
  "ParentReportDetail"
>;

export function ParentReportDetailScreen({ navigation, route }: Props) {
  const theme = useTheme();
  const { reportId } = route.params;
  const { data: report, isLoading } = useReportDetail(reportId);
  const sessionId = Array.isArray(report?.session_log_id)
    ? report.session_log_id[0]
    : 0;
  const { data: session } = useSessionDetail(sessionId);
  const { data: objectives = [] } = useSessionObjectives(
    report?.objective_ids ?? [],
  );
  const markRead = useMarkReportRead();

  useEffect(() => {
    if (report?.status === "sent") {
      markRead.mutateAsync(report.id).catch(() => {});
    }
  }, [report?.id, report?.status]);

  const handleObjectivePress = (objectiveId: number) => {
    const parent = navigation.getParent();
    parent?.navigate("ChildTab" as any, {
      screen: "ChildIepObjectiveDetail",
      params: { objectiveId },
    });
  };

  if (isLoading || !report) return <LoadingOverlay visible />;

  const statusCfg =
    REPORT_STATUS_HERO_CONFIG[report.status] ?? REPORT_STATUS_HERO_CONFIG.draft;
  const studentName = Array.isArray(report.student_id)
    ? report.student_id[1]
    : "";
  const teacherName = Array.isArray(report.teacher_id)
    ? report.teacher_id[1]
    : "";
  const durationMin = Math.round((report.session_duration || 0) * 60);
  const perfCfg = report.overall_performance
    ? PERFORMANCE_CONFIG[report.overall_performance]
    : null;
  const isUnread = report.status === "sent";

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.container}
    >
      {/* ── Gradient Hero Card (giống IepPlanDetailScreen) ── */}
      <View
        style={[styles.heroCard, { backgroundColor: theme.colors.surface }]}
      >
        <LinearGradient
          colors={[G1, G2]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.heroGrad}
        >
          {/* Unread indicator */}
          {isUnread && (
            <View style={styles.unreadBanner}>
              <View style={styles.unreadDot} />
              <Text style={styles.unreadText}>Báo cáo mới — chưa đọc</Text>
            </View>
          )}

          <View style={styles.heroMain}>
            <View style={styles.heroIconBubble}>
              <MaterialCommunityIcons
                name="file-document-outline"
                size={20}
                color="#fff"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroLabel}>Báo cáo buổi học</Text>
              <Text style={styles.heroTitle} numberOfLines={2}>
                {report.name}
              </Text>
              {studentName ? (
                <Text style={styles.heroSub} numberOfLines={1}>
                  {studentName}
                </Text>
              ) : null}
            </View>
          </View>

          {/* Status + performance badges */}
          <View style={styles.heroBadges}>
            <View
              style={[
                styles.badge,
                { backgroundColor: "rgba(255,255,255,0.22)" },
              ]}
            >
              <MaterialCommunityIcons
                name={statusCfg.icon as any}
                size={12}
                color="#fff"
              />
              <Text style={styles.badgeText}>{statusCfg.label}</Text>
            </View>
            {perfCfg && (
              <View
                style={[
                  styles.badge,
                  { backgroundColor: "rgba(255,255,255,0.22)" },
                ]}
              >
                <MaterialCommunityIcons
                  name={perfCfg.icon as any}
                  size={12}
                  color="#fff"
                />
                <Text style={styles.badgeText}>{perfCfg.label}</Text>
              </View>
            )}
          </View>
        </LinearGradient>

        {/* Meta rows */}
        <View style={styles.heroMeta}>
          <MetaRow
            icon="calendar-today"
            value={formatDate(report.report_date)}
          />
          {teacherName ? (
            <MetaRow icon="account-tie-outline" value={teacherName} />
          ) : null}
          {durationMin > 0 ? (
            <MetaRow icon="clock-outline" value={`${durationMin} phút`} />
          ) : null}
        </View>
      </View>

      {/* ── Quan sát buổi học ── */}
      {(session?.attendance || session?.mood || session?.energy_level) && (
        <>
          <SectionLabel
            icon="eye-outline"
            title="Quan Sát Buổi Học"
            theme={theme}
          />
          <Surface style={styles.infoCard} elevation={1}>
            {session?.attendance ? (
              <>
                <InfoRow
                  icon="check-decagram-outline"
                  label="Điểm danh"
                  value={obsLabel("attendance", session.attendance)}
                />
                <Divider style={styles.rowDivider} />
              </>
            ) : null}
            {session?.mood ? (
              <>
                <InfoRow
                  icon="emoticon-outline"
                  label="Tâm trạng"
                  value={obsLabel("mood", session.mood)}
                />
                <Divider style={styles.rowDivider} />
              </>
            ) : null}
            {session?.energy_level ? (
              <>
                <InfoRow
                  icon="flash-outline"
                  label="Năng lượng"
                  value={obsLabel("energy_level", session.energy_level)}
                />
                {session?.engagement_level ? (
                  <Divider style={styles.rowDivider} />
                ) : null}
              </>
            ) : null}
            {session?.engagement_level ? (
              <InfoRow
                icon="account-heart-outline"
                label="Tập trung"
                value={obsLabel("engagement_level", session.engagement_level)}
              />
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
        </>
      )}

      {/* ── Mục Tiêu Đã Học ── */}
      {objectives.length > 0 ? (
        <>
          <SectionLabel
            icon="target"
            title={`Mục Tiêu Đã Học (${objectives.length})`}
            theme={theme}
          />
          {objectives.map((obj) => (
            <ObjectiveCard
              key={obj.id}
              objective={obj}
              onPress={handleObjectivePress}
            />
          ))}
        </>
      ) : null}

      {/* ── Sent / Read banner ── */}
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
      {REPORT_FIELDS_PARENT.map((field) => {
        const value = (report as any)[field.name];
        if (!value) return null;
        return (
          <Surface key={field.name} style={styles.contentCard} elevation={1}>
            <View style={styles.contentCardHeader}>
              <View
                style={[
                  styles.iconBubble,
                  { backgroundColor: `${field.color}18` },
                ]}
              >
                <MaterialCommunityIcons
                  name={field.icon}
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
    </ScrollView>
  );
}

// ── Sub-components ────────────────────────────────────────────────

function MetaRow({ icon, value }: { icon: string; value: string }) {
  const theme = useTheme();
  return (
    <View style={styles.metaRow}>
      <MaterialCommunityIcons name={icon as any} size={15} color={G1} />
      <Text
        variant="bodySmall"
        style={[styles.metaText, { color: theme.colors.onSurfaceVariant }]}
      >
        {value}
      </Text>
    </View>
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

// ── Styles ────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 48 },

  // Hero card
  heroCard: {
    borderRadius: 16,
    marginBottom: 20,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        // shadowColor: G1,
        // shadowOffset: { width: 0, height: 4 },
        // shadowOpacity: 0.15,
        // shadowRadius: 10,
      },
      android: { elevation: 4 },
    }),
  },
  heroGrad: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 14,
  },
  unreadBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 12,
    alignSelf: "flex-start",
  },
  unreadDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#fff" },
  unreadText: { fontSize: 11, fontWeight: "700", color: "#fff" },
  heroMain: { flexDirection: "row", alignItems: "center", gap: 10 },
  heroIconBubble: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "rgba(255,255,255,0.75)",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  heroTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#fff",
    lineHeight: 20,
  },
  heroSub: {
    fontSize: 12,
    color: "rgba(255,255,255,0.75)",
    marginTop: 2,
  },
  heroBadges: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
    flexWrap: "wrap",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: { fontSize: 12, fontWeight: "600", color: "#fff" },
  heroMeta: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 12,
    gap: 8,
  },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  metaText: { flex: 1, fontSize: 13 },

  // Section label
  sectionLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
    marginTop: 4,
  },

  // Info card
  infoCard: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 10,
  },
  rowDivider: { marginHorizontal: -14 },

  // Sent banner
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

  // Content cards
  contentCard: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  contentCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
    // backgroundColor: "red",
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
});
