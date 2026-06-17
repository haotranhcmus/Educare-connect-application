import React, { useState, useEffect, Suspense } from "react";
import {
  ScrollView,
  View,
  StyleSheet,
  Alert,
  Image,
  TouchableOpacity,
  Modal,
  Dimensions,
  Platform,
} from "react-native";
import Carousel, { ICarouselInstance } from "react-native-reanimated-carousel";
import * as Haptics from "expo-haptics";
import { toast } from "@utils/toast";
import { useRef } from "react";
import {
  Text,
  Button,
  Divider,
  useTheme,
  Surface,
  Chip,
} from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  useSendReport,
  useReportPhotos,
  useReportDetailSuspense,
} from "@hooks/useReports";
import { useSessionObjectives } from "@hooks/useSessions";
import { useRequireOnline } from "@hooks/useRequireOnline";
import { ObjectiveCard } from "@components/iep/ObjectiveCard";
import {
  REPORT_STATUS_HERO_CONFIG,
  PERFORMANCE_CONFIG,
} from "@theme/decorativeColors";
import { OBS_LABELS } from "@utils/labels";
import { REPORT_FIELDS } from "@constants/reportFields";
import { formatDate, formatDateTime } from "@utils/formatters";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { ReportStackParamList } from "@navigation/types";
import { theme as appTheme } from "@/src/theme/theme";
import {
  ReportDetailSkeleton,
  ReportObjectivesSkeleton,
  ReportPhotosSkeleton,
} from "@screens/teacher/report/ReportDetailSkeleton";

type Props = NativeStackScreenProps<ReportStackParamList, "ReportDetail">;

const SCREEN_WIDTH = Dimensions.get("window").width;
const G1 = "#2E7D32";
const G2 = "#43A047";
const G_LIGHT = "#E8F5E9";

function ReportDetailContent({ navigation, route }: Props) {
  const theme = useTheme();
  const { reportId } = route.params;
  const { data: report } = useReportDetailSuspense(reportId);
  const sendReport = useSendReport();
  const { data: photoUrls, isLoading: photosLoading } = useReportPhotos(
    report?.photo_ids,
  );
  const { data: objectives = [], isLoading: objectivesLoading } =
    useSessionObjectives(report?.objective_ids ?? []);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [lightboxCurrentIndex, setLightboxCurrentIndex] = useState(0);
  const carouselRef = useRef<ICarouselInstance>(null);
  const [sentModalVisible, setSentModalVisible] = useState(false);

  useEffect(() => {
    if (lightboxIndex !== null) {
      setLightboxCurrentIndex(lightboxIndex);
    }
  }, [lightboxIndex]);

  const handleObjectivePress = (objectiveId: number) => {
    navigation
      .getParent()
      ?.navigate("IepObjectiveDetail" as any, { objectiveId });
  };

  const statusCfg =
    REPORT_STATUS_HERO_CONFIG[report.status] ?? REPORT_STATUS_HERO_CONFIG.draft;
  const isDraft = report.status === "draft";
  const isSentOrRead = report.status === "sent" || report.status === "read";
  const studentName = Array.isArray(report.student_id)
    ? report.student_id[1]
    : "";
  const durationMin = Math.round((report.session_duration || 0) * 60);
  const perfCfg = report.overall_performance
    ? PERFORMANCE_CONFIG[report.overall_performance]
    : null;

  const requireOnline = useRequireOnline();
  const handleEdit = () =>
    requireOnline(() =>
      navigation.navigate("ReportCreate", {
        reportId: report.id,
        sessionId: Array.isArray(report.session_log_id)
          ? report.session_log_id[0]
          : undefined,
      }),
    );

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
              await Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success,
              );
              setSentModalVisible(true);
            } catch {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              toast.error("Không thể gửi báo cáo");
            }
          },
        },
      ],
    );
  };

  return (
    <>
      <ScrollView
        style={{ flex: 1, backgroundColor: theme.colors.background }}
        contentContainerStyle={styles.container}
      >
        {/* ── Hero Header Card ─────────────────────────── */}
        <View style={styles.heroWrapper}>
          <LinearGradient
            colors={[G1, G2]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.heroCard}
          >
            {/* Top row: icon + report name + student */}
            <View style={styles.heroTop}>
              <View style={styles.heroIconWrap}>
                <MaterialCommunityIcons
                  name="file-document-outline"
                  size={26}
                  color="#fff"
                />
              </View>
              <View style={styles.heroInfo}>
                <Text style={styles.heroTitle} numberOfLines={2}>
                  {report.name}
                </Text>
                <View style={styles.heroStudentRow}>
                  <MaterialCommunityIcons
                    name="account-outline"
                    size={13}
                    color="rgba(255,255,255,0.75)"
                  />
                  <Text style={styles.heroStudentName}>{studentName}</Text>
                </View>
              </View>
            </View>

            {/* Divider */}
            <View style={styles.heroDivider} />

            {/* Bottom row: date + status + performance */}
            <View style={styles.heroBottom}>
              {/* Date chip */}
              <View style={styles.heroDateChip}>
                <MaterialCommunityIcons
                  name="calendar-outline"
                  size={12}
                  color="rgba(255,255,255,0.85)"
                />
                <Text style={styles.heroDateText}>
                  {formatDate(report.report_date)}
                </Text>
              </View>

              <View style={styles.heroBadges}>
                {/* Status badge */}
                <View
                  style={[styles.heroBadge, { backgroundColor: statusCfg.bg }]}
                >
                  <MaterialCommunityIcons
                    name={statusCfg.icon as any}
                    size={12}
                    color={statusCfg.color}
                  />
                  <Text
                    style={[styles.heroBadgeText, { color: statusCfg.color }]}
                  >
                    {statusCfg.label}
                  </Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>
        {/* ── Session Info ──────────────────────────────── */}
        <SectionLabel
          icon="calendar-clock"
          title="Thông Tin Buổi Học"
          theme={theme}
        />
        <Surface
          style={[styles.infoCard, { backgroundColor: theme.colors.surface }]}
          elevation={1}
        >
          <InfoRow icon="account" label="Học sinh" value={studentName} />
          <Divider style={styles.rowDivider} />
          <InfoRow
            icon="calendar-today"
            label="Ngày báo cáo"
            value={formatDate(report.report_date)}
          />
          <Divider style={styles.rowDivider} />
          <InfoRow
            icon="clock-outline"
            label="Thời lượng"
            value={durationMin > 0 ? `${durationMin} phút` : "—"}
          />
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
        {/* ── Overall Performance ──────────────────────────────── */}
        {report.attendance ||
        report.mood ||
        report.energy_level ||
        report.engagement_level ||
        report.observation_notes ? (
          <>
            <SectionLabel
              icon="emoticon-happy-outline"
              title="Quan Sát Chung"
              theme={theme}
            />
            <Surface
              style={[
                styles.infoCard,
                { backgroundColor: theme.colors.surface },
              ]}
              elevation={1}
            >
              {report.attendance ? (
                <InfoRow
                  icon="calendar-check"
                  label="Điểm danh"
                  value={
                    OBS_LABELS.attendance[report.attendance] ??
                    report.attendance
                  }
                />
              ) : null}
              {report.mood ? (
                <>
                  <Divider style={styles.rowDivider} />
                  <InfoRow
                    icon="emoticon-outline"
                    label="Tâm trạng"
                    value={OBS_LABELS.mood[report.mood] ?? report.mood}
                  />
                </>
              ) : null}
              {report.energy_level ? (
                <>
                  <Divider style={styles.rowDivider} />
                  <InfoRow
                    icon="lightning-bolt"
                    label="Năng lượng"
                    value={
                      OBS_LABELS.energy_level[report.energy_level] ??
                      report.energy_level
                    }
                  />
                </>
              ) : null}
              {report.engagement_level ? (
                <>
                  <Divider style={styles.rowDivider} />
                  <InfoRow
                    icon="brain"
                    label="Tập trung"
                    value={
                      OBS_LABELS.engagement_level[report.engagement_level] ??
                      report.engagement_level
                    }
                  />
                </>
              ) : null}
              {report.observation_notes ? (
                <>
                  <Divider style={styles.rowDivider} />
                  <InfoRow
                    icon="note-text-outline"
                    label="Ghi chú"
                    value={report.observation_notes}
                  />
                </>
              ) : null}
            </Surface>
          </>
        ) : null}
        {/* ── Mục Tiêu Đã Học — load độc lập với report header ─── */}
        {objectivesLoading && (report.objective_ids?.length ?? 0) > 0 ? (
          <ReportObjectivesSkeleton
            count={Math.min(report.objective_ids?.length ?? 2, 3)}
          />
        ) : objectives.length > 0 ? (
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
        {/* ── Ảnh Báo Cáo — load độc lập với report header ─── */}
        {report.photo_ids && report.photo_ids.length > 0 ? (
          photosLoading ? (
            <ReportPhotosSkeleton
              count={Math.min(report.photo_ids.length, 6)}
            />
          ) : (
            <>
              <SectionLabel
                icon="image-multiple-outline"
                title={`Hình ảnh (${report.photo_ids.length})`}
                theme={theme}
              />
              <Surface
                style={[
                  styles.infoCard,
                  {
                    paddingVertical: 12,
                    backgroundColor: theme.colors.surface,
                  },
                ]}
                elevation={1}
              >
                <View style={styles.photoGrid}>
                  {(photoUrls ?? []).map((uri, idx) => (
                    <TouchableOpacity
                      key={idx}
                      onPress={() => setLightboxIndex(idx)}
                      activeOpacity={0.85}
                    >
                      <Image
                        source={{ uri }}
                        style={styles.photoThumb}
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </Surface>
              <Modal
                visible={lightboxIndex !== null}
                transparent
                animationType="fade"
                onRequestClose={() => setLightboxIndex(null)}
              >
                <View style={styles.lightboxOverlay}>
                  <TouchableOpacity
                    style={styles.lightboxClose}
                    onPress={() => setLightboxIndex(null)}
                  >
                    <MaterialCommunityIcons
                      name="close"
                      size={28}
                      color="#fff"
                    />
                  </TouchableOpacity>
                  {lightboxIndex !== null && (
                    <Carousel
                      ref={carouselRef}
                      key={lightboxIndex}
                      width={SCREEN_WIDTH}
                      height={SCREEN_WIDTH}
                      data={photoUrls ?? []}
                      defaultIndex={lightboxIndex}
                      onSnapToItem={setLightboxCurrentIndex}
                      renderItem={({ item }) => (
                        <Image
                          source={{ uri: item as string }}
                          style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH }}
                          resizeMode="contain"
                        />
                      )}
                    />
                  )}
                  <Text style={styles.lightboxCounter}>
                    {lightboxCurrentIndex + 1} / {(photoUrls ?? []).length}
                  </Text>
                </View>
              </Modal>
            </>
          )
        ) : null}
        {REPORT_FIELDS.map((field) => {
          const value = (report as any)[field.name];
          if (!value) return null;
          return (
            <Surface
              key={field.name}
              style={[
                styles.contentCard,
                { backgroundColor: theme.colors.surface },
              ]}
              elevation={1}
            >
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
        {/* ── Actions ───────────────────────────────────── */}
        {isDraft && (
          <>
            <Divider style={{ marginTop: 16, marginBottom: 16 }} />
            <View style={styles.actions}>
              <Button
                mode="outlined"
                icon="pencil"
                onPress={handleEdit}
                style={styles.actionBtn}
              >
                Chỉnh sửa
              </Button>
              <Button
                mode="contained"
                icon="send"
                onPress={handleSend}
                loading={sendReport.isPending}
                style={styles.actionBtn}
              >
                Gửi phụ huynh
              </Button>
            </View>
          </>
        )}
      </ScrollView>

      {/* ── Sent success modal ──────────────────────────── */}
      <Modal
        visible={sentModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSentModalVisible(false)}
      >
        <View style={styles.sentModalOverlay}>
          <View
            style={[
              styles.sentModalCard,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            <MaterialCommunityIcons
              name="send-check"
              size={56}
              color={theme.colors.primary}
            />
            <Text
              variant="titleMedium"
              style={{
                fontWeight: "700",
                marginTop: 16,
                textAlign: "center",
              }}
            >
              Đã gửi báo cáo!
            </Text>
            <Text
              variant="bodySmall"
              style={{
                color: theme.colors.onSurfaceVariant,
                marginTop: 8,
                textAlign: "center",
              }}
            >
              Báo cáo đã được gửi đến phụ huynh qua email.
            </Text>
            <Button
              mode="contained"
              style={{ marginTop: 24, minWidth: 120 }}
              onPress={() => setSentModalVisible(false)}
            >
              Đóng
            </Button>
          </View>
        </View>
      </Modal>
    </>
  );
}

// ── Helpers ───────────────────────────────────────────────────
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

export function ReportDetailScreen(props: Props) {
  return (
    <Suspense fallback={<ReportDetailSkeleton />}>
      <ReportDetailContent {...props} />
    </Suspense>
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

// ── Styles ────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 48 },

  // ── Hero ────────────────────────────────────────────────────
  heroWrapper: {
    borderRadius: 18,
    marginBottom: 22,
    ...Platform.select({
      ios: {
        // shadowColor: G1,
        // shadowOffset: { width: 0, height: 6 },
        // shadowOpacity: 0.18,
        // shadowRadius: 16,
      },
      android: { elevation: 6 },
    }),
  },
  heroCard: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 14,
    gap: 12,
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  heroIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroInfo: {
    flex: 1,
    gap: 5,
  },
  heroTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.2,
    lineHeight: 22,
  },
  heroStudentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  heroStudentName: {
    fontSize: 13,
    fontWeight: "500",
    color: "rgba(255,255,255,0.82)",
  },
  heroDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginHorizontal: -16,
  },
  heroBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  heroDateChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  heroDateText: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.92)",
  },
  heroBadges: {
    flexDirection: "row",
    gap: 6,
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
  },
  heroBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },

  // ── Section label ────────────────────────────────────────────
  sectionLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
    marginTop: 4,
  },

  // ── Info card ────────────────────────────────────────────────
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

  // ── Sent banner ──────────────────────────────────────────────
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

  // ── Content cards ────────────────────────────────────────────
  contentCard: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
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

  // ── Photos ───────────────────────────────────────────────────
  photoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  photoThumb: {
    width: 90,
    height: 90,
    borderRadius: 8,
    backgroundColor: "#eee",
  },
  lightboxOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.92)",
    justifyContent: "center",
    alignItems: "center",
  },
  lightboxClose: {
    position: "absolute",
    top: 48,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  lightboxCounter: { color: "#fff", fontSize: 14, marginTop: 12 },

  // ── Actions ──────────────────────────────────────────────────
  actions: { flexDirection: "row", gap: 10 },
  actionBtn: { flex: 1 },

  // ── Sent success modal ──────────────────────────────────────
  sentModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  sentModalCard: {
    width: "100%",
    maxWidth: 360,
    padding: 32,
    borderRadius: 20,
    alignItems: "center",
    elevation: 8,
  },
});
