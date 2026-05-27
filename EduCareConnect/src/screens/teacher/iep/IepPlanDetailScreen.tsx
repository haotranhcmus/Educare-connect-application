import React, { useState, useLayoutEffect, useCallback, Suspense } from "react";
import {
  View,
  StyleSheet,
  Platform,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { toast } from "@utils/toast";
import {
  Text,
  useTheme,
  IconButton,
  Button,
  Surface,
  Modal,
  Portal,
} from "react-native-paper";
import { useQueryClient } from "@tanstack/react-query";
import { callKw } from "@api/odooClient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  cacheDirectory,
  writeAsStringAsync,
  EncodingType,
} from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { StatusBadge } from "@components/common/StatusBadge";
import { SectionHeader } from "@components/common/SectionHeader";
import { GoalCard } from "@components/iep/GoalCard";
import { useIepPlanDetailSuspense, useGoalsForPlan } from "@hooks/useIep";
import {
  IepPlanDetailSkeleton,
  IepPlanGoalsSkeleton,
} from "@screens/teacher/iep/IepPlanDetailSkeleton";
import { ODOO_BASE_URL, client, searchRead } from "@api/odooClient";
import { queryKeys } from "@api/queryKeys";
import { useAuthStore } from "@store/authStore";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import IepPlaceholder from "@assets/placeholder/svg/iep-placeholder.svg";
import { formatDate } from "@utils/formatters";

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const CHUNK = 0x8000;
  const parts: string[] = [];
  for (let i = 0; i < bytes.length; i += CHUNK) {
    parts.push(
      String.fromCharCode(
        ...(bytes.subarray(i, i + CHUNK) as unknown as number[]),
      ),
    );
  }
  return btoa(parts.join(""));
}

function safeFilename(s: string): string {
  return s
    .replace(/[/\\:*?"<>|]/g, "")
    .replace(/\s+/g, "_")
    .slice(0, 60);
}

const G1 = "#2E7D32";
const G2 = "#43A047";
const G_LIGHT = "#E8F5E9";
const G_TEXT = "#1B5E20";

const PLAN_GRADIENT: Record<string, [string, string]> = {
  draft: ["#616161", "#9E9E9E"],
  ready_review: ["#F57F17", "#FFA000"],
  supervisor_approved: ["#1565C0", "#1E88E5"],
  active: ["#1565C0", "#1E88E5"],
  completed: ["#2E7D32", "#43A047"],
  closed: ["#424242", "#616161"],
};

interface Objective {
  name: string;
  accuracy: number;
}

interface SessionInfoCardProps {
  studentName: string;
  reportDate: string;
  durationMinutes: number;
  performance: string | null;
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
    <View style={styles.wrapper}>
      <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        {/* ── Gradient header ─────────────────────── */}
        <LinearGradient
          colors={[G1, G2]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.header}
        >
          <View style={styles.headerIconWrap}>
            <MaterialCommunityIcons
              name="account-circle-outline"
              size={22}
              color="#fff"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerLabel}>Học sinh</Text>
            <Text style={styles.headerName} numberOfLines={1}>
              {studentName}
            </Text>
          </View>
          {performance && (
            <View style={styles.perfPill}>
              <MaterialCommunityIcons
                name="star-outline"
                size={11}
                color="#fff"
              />
              <Text style={styles.perfText}>{performance}</Text>
            </View>
          )}
        </LinearGradient>

        {/* ── Meta row ────────────────────────────── */}
        <View style={styles.metaRow}>
          <MetaChip icon="calendar-outline" label={reportDate} />
          <MetaChip icon="clock-outline" label={`${durationMinutes} phút`} />
          {avgAccuracy > 0 && (
            <MetaChip
              icon="percent"
              label={`TB ${Math.round(avgAccuracy)}%`}
              accent
            />
          )}
        </View>

        {/* ── Objectives ──────────────────────────── */}
        {objectives.length > 0 && (
          <>
            <View
              style={[
                styles.divider,
                { backgroundColor: theme.colors.outlineVariant },
              ]}
            />
            <View style={styles.objectivesSection}>
              <View style={styles.objTitleRow}>
                <MaterialCommunityIcons name="target" size={14} color={G1} />
                <Text style={[styles.objTitle, { color: G_TEXT }]}>
                  Mục tiêu đã thực hành
                </Text>
              </View>
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
          </>
        )}
      </View>
    </View>
  );
}

// ── Meta chip ─────────────────────────────────────────────────
function MetaChip({
  icon,
  label,
  accent = false,
}: {
  icon: string;
  label: string;
  accent?: boolean;
}) {
  return (
    <View style={[styles.metaChip, { backgroundColor: accent ? G1 : G_LIGHT }]}>
      <MaterialCommunityIcons
        name={icon as any}
        size={12}
        color={accent ? "#fff" : G_TEXT}
      />
      <Text style={[styles.metaChipText, { color: accent ? "#fff" : G_TEXT }]}>
        {label}
      </Text>
    </View>
  );
}

// ── Objective item ────────────────────────────────────────────
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

  let barColor = theme.colors.error;
  if (accuracy >= 80) barColor = G1;
  else if (accuracy >= 50) barColor = "#E67E22";

  const barBg =
    accuracy >= 80 ? G_LIGHT : accuracy >= 50 ? "#FFF3E0" : "#FFEBEE";

  return (
    <View style={styles.objectiveItem}>
      <View style={styles.objectiveHeader}>
        <Text
          style={[styles.objectiveName, { color: theme.colors.onSurface }]}
          numberOfLines={2}
        >
          {name}
        </Text>
        <View style={[styles.accBadge, { backgroundColor: `${barColor}18` }]}>
          <Text style={[styles.accText, { color: barColor }]}>{acc}%</Text>
        </View>
      </View>

      {/* Custom progress bar */}
      <View style={[styles.progressTrack, { backgroundColor: barBg }]}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${Math.min(100, acc)}%`,
              backgroundColor: barColor,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 16,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        // shadowColor: G1,
        // shadowOffset: { width: 0, height: 4 },
        // shadowOpacity: 0.12,
        // shadowRadius: 12,
      },
      android: { elevation: 5 },
    }),
  },

  card: {
    borderRadius: 16,
    overflow: "hidden",
  },

  // ── Header ────────────────────────────────────────────────
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 10,
  },
  headerIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "rgba(255,255,255,0.75)",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  headerName: {
    fontSize: 15,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.1,
  },
  perfPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.22)",
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  perfText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#fff",
  },

  // ── Meta row ──────────────────────────────────────────────
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 9,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  metaChipText: {
    fontSize: 12,
    fontWeight: "600",
  },

  // ── Divider ───────────────────────────────────────────────
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 14,
  },

  // ── Objectives ────────────────────────────────────────────
  objectivesSection: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 14,
  },
  objTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  objTitle: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  objectivesContainer: {
    gap: 12,
  },
  objectiveItem: {
    gap: 6,
  },
  objectiveHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  objectiveName: {
    flex: 1,
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 18,
  },
  accBadge: {
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  accText: {
    fontSize: 12,
    fontWeight: "800",
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
});

// ── IepPlanDetailContent ──────────────────────────────────────
function IepPlanDetailContent({ route, navigation }: any) {
  const { planId, objectiveRouteName = "IepObjectiveDetail" } =
    route.params as {
      planId: number;
      studentName?: string;
      objectiveRouteName?: string;
    };
  const theme = useTheme();
  const role = useAuthStore((s) => s.role);
  const isTeacher = role === "teacher";
  const [expandedGoalId, setExpandedGoalId] = useState<number | null>(null);
  const [downloading, setDownloading] = useState(false);

  const queryClient = useQueryClient();
  const { data: plan, refetch } = useIepPlanDetailSuspense(planId);
  const { data: goals = [], isLoading: goalsLoading } = useGoalsForPlan(planId);
  const planGrad = PLAN_GRADIENT[plan?.status ?? "active"] ?? PLAN_GRADIENT.active;
  const [endingIep, setEndingIep] = useState(false);
  const [endIepModalVisible, setEndIepModalVisible] = useState(false);
  const [scheduledSessions, setScheduledSessions] = useState<Array<{
    id: number; name: string; session_date: string; start_time: number; end_time: number; status: string;
  }>>([]);
  const [loadingScheduled, setLoadingScheduled] = useState(false);

  const openEndIepModal = useCallback(async () => {
    setLoadingScheduled(true);
    setEndIepModalVisible(true);
    try {
      const studentId = Array.isArray(plan?.student_id)
        ? plan.student_id[0]
        : null;
      if (studentId) {
        const sessions = await searchRead<{
            id: number;
            name: string;
            session_date: string;
            start_time: number;
            end_time: number;
            status: string;
          }>(
            "educare.session.log",
            [
              ["student_id", "=", studentId],
              ["status", "in", ["scheduled", "completed"]],
            ],
            ["id", "name", "session_date", "start_time", "end_time", "status"],
            { limit: 20 },
          );
        setScheduledSessions(sessions as any[]);
      }
    } catch {
      setScheduledSessions([]);
    } finally {
      setLoadingScheduled(false);
    }
  }, [plan]);

  const handleEndIep = useCallback(async () => {
    setEndingIep(true);
    try {
      await callKw("educare.iep.plan", "action_end_iep_period", [[planId]]);
      setEndIepModalVisible(false);
      toast.success("Kỳ IEP đã kết thúc");
      queryClient.invalidateQueries({ queryKey: queryKeys.iepPlans.all });
      queryClient.invalidateQueries({ queryKey: ["students", "iep-plans"] });
      refetch();
    } catch (e: any) {
      toast.error("Không thể kết thúc kỳ IEP", e?.message);
    } finally {
      setEndingIep(false);
    }
  }, [planId, refetch, queryClient]);

  const handleDownload = useCallback(async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      const reportUrl = `${ODOO_BASE_URL}/report/pdf/educare_iep.report_educare_iep_plan_document/${planId}`;

      // Use the shared axios client so the session cookie interceptor fires
      const response = await client.get<ArrayBuffer>(reportUrl, {
        responseType: "arraybuffer",
      });

      if (response.status !== 200) {
        throw new Error(`Lỗi server (${response.status}). Vui lòng thử lại.`);
      }

      // Verify the server returned a real PDF, not an HTML error page
      const magic = new Uint8Array(response.data).slice(0, 4);
      if (String.fromCharCode(...magic) !== "%PDF") {
        throw new Error("Server không trả về PDF. Vui lòng đăng nhập lại.");
      }

      const studentName = Array.isArray(plan?.student_id)
        ? plan.student_id[1]
        : "";
      const period = plan?.iep_period ?? "";
      const filename = `Ke_Hoach_IEP_${safeFilename(studentName)}_${safeFilename(period)}.pdf`;

      const base64 = arrayBufferToBase64(response.data);
      const localUri = `${cacheDirectory}${filename}`;
      await writeAsStringAsync(localUri, base64, {
        encoding: EncodingType.Base64,
      });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(localUri, {
          mimeType: "application/pdf",
          dialogTitle: `Kế hoạch IEP — ${studentName}`,
          UTI: "com.adobe.pdf",
        });
      } else {
        toast.info("Thiết bị không hỗ trợ chia sẻ file");
      }
    } catch (e: any) {
      toast.error("Lỗi tải file", e?.message || "Không thể tải kế hoạch IEP");
    } finally {
      setDownloading(false);
    }
  }, [planId, downloading, plan]);

  // Download icon in navigation header
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () =>
        downloading ? (
          <ActivityIndicator
            size="small"
            color="#fff"
            style={{ marginRight: 14 }}
          />
        ) : (
          <IconButton
            icon="download-outline"
            size={22}
            iconColor="#fff"
            onPress={handleDownload}
          />
        ),
    });
  }, [navigation, downloading, handleDownload]);

  const teacherName = Array.isArray(plan.assigned_teacher_id)
    ? plan.assigned_teacher_id[1]
    : "";
  const supervisorName = Array.isArray(plan.supervisor_id)
    ? plan.supervisor_id[1]
    : "";

  const handleObjectivePress = (objectiveId: number) => {
    navigation.navigate(objectiveRouteName, { objectiveId });
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={screenStyles.content}
      refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} />}
    >
      {/* ── Plan header card ── */}
      <View
        style={[
          screenStyles.planCard,
          { backgroundColor: theme.colors.surface },
        ]}
      >
        {/* Gradient banner — color tracks plan.status */}
        <LinearGradient
          colors={planGrad}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={screenStyles.planGradHeader}
        >
          <View style={screenStyles.planIconBubble}>
            <MaterialCommunityIcons
              name="clipboard-text-outline"
              size={20}
              color="#fff"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={screenStyles.planTitle} numberOfLines={2}>
              {plan.iep_period}
            </Text>
          </View>
          <StatusBadge
            status={plan.status === "completed" ? "iep_completed" : plan.status}
          />
        </LinearGradient>

        {/* Meta rows */}
        <View style={screenStyles.planMeta}>
          {(plan.start_date || plan.end_date) && (
            <View style={screenStyles.planMetaRow}>
              <MaterialCommunityIcons
                name="calendar-range"
                size={15}
                color={planGrad[0]}
              />
              <Text
                variant="bodySmall"
                style={[
                  screenStyles.planMetaText,
                  { color: theme.colors.onSurface },
                ]}
              >
                {formatDate(plan.start_date)} – {formatDate(plan.end_date)}
              </Text>
            </View>
          )}
          {teacherName ? (
            <View style={screenStyles.planMetaRow}>
              <MaterialCommunityIcons
                name="account-tie-outline"
                size={15}
                color={planGrad[0]}
              />
              <Text
                variant="bodySmall"
                style={[
                  screenStyles.planMetaText,
                  { color: theme.colors.onSurface },
                ]}
              >
                {teacherName}
              </Text>
            </View>
          ) : null}
          {supervisorName ? (
            <View style={screenStyles.planMetaRow}>
              <MaterialCommunityIcons
                name="account-supervisor-outline"
                size={15}
                color={planGrad[0]}
              />
              <Text
                variant="bodySmall"
                style={[
                  screenStyles.planMetaText,
                  { color: theme.colors.onSurface },
                ]}
              >
                {supervisorName}
              </Text>
            </View>
          ) : null}
          <View style={screenStyles.planMetaRow}>
            <MaterialCommunityIcons name="tag-outline" size={15} color={G1} />
            <Text
              variant="bodySmall"
              style={[
                screenStyles.planMetaText,
                { color: theme.colors.onSurface },
              ]}
            >
              Phiên bản {plan.version_number}
            </Text>
          </View>
        </View>
      </View>

      {/* ── Maintenance mode banner ── */}
      {plan.status === "active" && plan.maintenance_mode && (
        <Surface style={screenStyles.maintenanceBanner} elevation={0}>
          <MaterialCommunityIcons
            name="check-decagram"
            size={20}
            color="#2E7D32"
          />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text
              variant="labelLarge"
              style={{
                fontWeight: "700",
                color: "#1B5E20",
                textAlign: "center",
              }}
            >
              Đang ở chế độ duy trì
            </Text>
            <Text
              variant="bodySmall"
              style={{
                color: "#388E3C",
                marginVertical: 8,
                textAlign: "center",
              }}
            >
              Tất cả mục tiêu đã hoàn thành.
            </Text>
          </View>
          {isTeacher && (
            <Button
              mode="contained"
              compact
              onPress={openEndIepModal}
              disabled={endingIep}
              buttonColor="#2E7D32"
              style={{ borderRadius: 8 }}
              labelStyle={{ fontSize: 12 }}
            >
              Kết thúc kỳ IEP
            </Button>
          )}
        </Surface>
      )}

      {/* ── End IEP confirmation modal (teacher only) ── */}
      {isTeacher && (
      <Portal>
        <Modal
          visible={endIepModalVisible}
          onDismiss={() => !endingIep && setEndIepModalVisible(false)}
          contentContainerStyle={[
            screenStyles.endIepModal,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <View style={screenStyles.endIepModalContent}>
            <View style={screenStyles.endIepIconWrap}>
              <MaterialCommunityIcons name="alert-outline" size={40} color="#E65100" />
            </View>
            <Text
              variant="titleMedium"
              style={{ fontWeight: "800", textAlign: "center", marginTop: 12, color: "#BF360C" }}
            >
              Kết thúc kỳ IEP?
            </Text>

            {loadingScheduled ? (
              <ActivityIndicator style={{ marginTop: 16 }} />
            ) : scheduledSessions.length > 0 ? (
              <View style={[screenStyles.endIepInfoBox, { backgroundColor: "#FFF3E0", borderColor: "#FFE0B2" }]}>
                <Text variant="bodySmall" style={{ color: "#E65100", fontWeight: "700", marginBottom: 4 }}>
                  {scheduledSessions.length} buổi học đã lên lịch sẽ bị hủy
                </Text>
                {scheduledSessions.slice(0, 4).map((s) => (
                  <Text key={s.id} variant="bodySmall" style={{ color: "#BF360C", lineHeight: 20 }}>
                    • {s.name} — {s.session_date}
                  </Text>
                ))}
                {scheduledSessions.length > 4 && (
                  <Text variant="bodySmall" style={{ color: "#BF360C" }}>
                    và {scheduledSessions.length - 4} buổi khác...
                  </Text>
                )}
              </View>
            ) : (
              <View style={[screenStyles.endIepInfoBox, { backgroundColor: "#FFF3E0", borderColor: "#FFE0B2" }]}>
                <Text variant="bodySmall" style={{ color: "#BF360C", lineHeight: 20 }}>
                  Không có buổi học nào đang lên lịch.
                </Text>
              </View>
            )}

            <View style={[screenStyles.endIepInfoBox, { backgroundColor: "#F3E5F5", borderColor: "#E1BEE7", marginTop: 8 }]}>
              <Text variant="bodySmall" style={{ color: "#6A1B9A", lineHeight: 20 }}>
                Sau khi kết thúc, bạn cần tạo kế hoạch IEP mới cho kỳ tiếp theo.
              </Text>
            </View>

            <View style={screenStyles.endIepBtnRow}>
              <Button
                mode="outlined"
                onPress={() => setEndIepModalVisible(false)}
                style={screenStyles.endIepBtn}
                disabled={endingIep}
              >
                Quay lại
              </Button>
              <Button
                mode="contained"
                onPress={handleEndIep}
                style={screenStyles.endIepBtn}
                loading={endingIep}
                disabled={endingIep}
                buttonColor="#BF360C"
              >
                Xác nhận
              </Button>
            </View>
          </View>
        </Modal>
      </Portal>
      )}

      {/* ── Goals — load độc lập với plan header ── */}
      {goalsLoading ? (
        <IepPlanGoalsSkeleton count={3} />
      ) : (
        <>
          <SectionHeader
            icon="bullseye-arrow"
            title={`Mục tiêu dài hạn (${goals.length})`}
          />

          {goals.length === 0 ? (
            <View style={screenStyles.emptyWrap}>
              <IepPlaceholder width={140} height={140} />
              <Text
                variant="bodyMedium"
                style={{ color: theme.colors.onSurface, marginTop: 12 }}
              >
                Chưa có mục tiêu nào
              </Text>
            </View>
          ) : (
            goals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                expanded={expandedGoalId === goal.id}
                onToggle={() =>
                  setExpandedGoalId((prev) =>
                    prev === goal.id ? null : goal.id,
                  )
                }
                onObjectivePress={handleObjectivePress}
              />
            ))
          )}
        </>
      )}
    </ScrollView>
  );
}

export function IepPlanDetailScreen(props: any) {
  return (
    <Suspense fallback={<IepPlanDetailSkeleton />}>
      <IepPlanDetailContent {...props} />
    </Suspense>
  );
}

const screenStyles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 32 },

  // ── Maintenance banner ────────────────────────────────────────
  maintenanceBanner: {
    flexDirection: "column",
    alignItems: "center",
    backgroundColor: "#E8F5E9",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#A5D6A7",
    textAlign: "center",
  },

  // ── End IEP confirmation modal ───────────────────────────────
  endIepModal: { marginHorizontal: 20, borderRadius: 20, overflow: "hidden" },
  endIepModalContent: { padding: 24, alignItems: "center" },
  endIepIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#FFF3E0",
    alignItems: "center",
    justifyContent: "center",
  },
  endIepInfoBox: {
    width: "100%",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  endIepBtnRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 20,
    width: "100%",
  },
  endIepBtn: { flex: 1 },

  // ── Plan header card ─────────────────────────────────────────
  planCard: {
    borderRadius: 16,
    marginBottom: 16,
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
  planGradHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 10,
  },
  planIconBubble: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  planLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "rgba(255,255,255,0.75)",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  planTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#fff",
    lineHeight: 20,
  },
  planMeta: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 12,
    gap: 8,
  },
  planMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  planMetaText: {
    flex: 1,
    fontSize: 13,
  },

  // ── Empty state ──────────────────────────────────────────────
  emptyWrap: {
    alignItems: "center",
    paddingVertical: 40,
  },
});
