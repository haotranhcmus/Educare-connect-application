import React, { Suspense, useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Modal,
  TextInput as RNTextInput,
  Platform,
} from "react-native";
import {
  Text,
  Button,
  Divider,
  useTheme,
  RadioButton,
  ActivityIndicator,
  Snackbar,
} from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { cancelSession, scheduleSession, deleteSession } from "@api/sessionApi";
import { queryKeys } from "@api/queryKeys";
import { useQueryClient } from "@tanstack/react-query";
import { AvatarLabel } from "@components/common/AvatarLabel";
import { StatusBadge } from "@components/common/StatusBadge";
import { SectionHeader } from "@components/common/SectionHeader";
import { ResultSummaryCard } from "@components/session/ResultSummaryCard";
import { ObjectiveDetailCard } from "@components/session/ObjectiveDetailCard";
import {
  useSessionResults,
  useSessionObjectives,
  useSessionDetailSuspense,
} from "@hooks/useSessions";
import { useReportForSession } from "@hooks/useReports";
import { formatDate, formatFloatTime } from "@utils/formatters";
import {
  SESSION_TYPE_SHORT_LABELS,
  SESSION_PURPOSE_LABELS,
  CANCEL_TYPE_LABELS,
  TEACHER_CANCEL_OPTIONS,
  PARENT_CANCEL_OPTIONS,
} from "@utils/labels";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  SessionDetailSkeleton,
  SessionObjectivesSkeleton,
  SessionResultsSkeleton,
} from "@screens/teacher/session/SessionDetailSkeleton";
import type { SessionResult } from "@/src/types/models";

const G1 = "#2E7D32";
const G2 = "#43A047";
const G_LIGHT = "#E8F5E9";

export type SessionDetailMode = "teacher" | "parent";

export interface SessionDetailNav {
  goBack: () => void;
  toEval?: (sessionId: number) => void;
  toEdit?: (sessionId: number) => void;
  toReport?: (reportId: number) => void;
  toCreateReport?: (sessionId: number) => void;
}

interface Props {
  sessionId: number;
  mode: SessionDetailMode;
  nav: SessionDetailNav;
}

function SessionDetailContent({ sessionId, mode, nav }: Props) {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const isParent = mode === "parent";

  const cancelOptions = isParent
    ? PARENT_CANCEL_OPTIONS
    : TEACHER_CANCEL_OPTIONS;
  const defaultCancelType = cancelOptions[0].value;

  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelType, setCancelType] = useState(defaultCancelType);
  const [cancelReason, setCancelReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [cancelError, setCancelError] = useState("");
  const [snackMessage, setSnackMessage] = useState("");
  const [snackVisible, setSnackVisible] = useState(false);
  const [scheduleErrorModal, setScheduleErrorModal] = useState<string | null>(
    null,
  );
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);

  const showSnack = (msg: string) => {
    setSnackMessage(msg);
    setSnackVisible(true);
  };

  const { data: session, refetch } = useSessionDetailSuspense(sessionId);
  const isDoneStatus = session?.status === "done";
  const { data: results = [], isLoading: resultsLoading } = useSessionResults(
    isDoneStatus && !isParent ? sessionId : 0,
  );
  const { data: existingReport } = useReportForSession(
    isDoneStatus && !isParent ? sessionId : 0,
  );
  const { data: sessionObjectives = [], isLoading: objectivesLoading } =
    useSessionObjectives(session?.objective_ids ?? []);

  if (!session) return null;

  const studentName =
    session.student_name ||
    (Array.isArray(session.student_id) ? session.student_id[1] : "");
  const isCancelled = session.status === "cancelled";
  const isDone = session.status === "done";
  const isDraft = session.status === "draft";
  const canCancel = session.status === "scheduled";

  // Teacher-only capabilities
  const canSchedule = !isParent && isDraft;
  const canEval =
    !isParent &&
    (session.status === "scheduled" || session.status === "completed");
  const canEdit = !isParent && (isDraft || session.status === "scheduled");
  const canDelete = !isParent && isDraft;
  const canReport = !isParent && isDone;

  const handleSchedule = async () => {
    setIsScheduling(true);
    try {
      await scheduleSession(sessionId);
      await queryClient.invalidateQueries({
        queryKey: queryKeys.sessions.detail(sessionId),
      });
      await queryClient.invalidateQueries({ queryKey: queryKeys.sessions.all });
      refetch();
      showSnack("Đã lên lịch buổi học thành công");
    } catch (e: any) {
      setScheduleErrorModal(e?.message || "Không thể lên lịch buổi học.");
    } finally {
      setIsScheduling(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteSession(sessionId);
      await queryClient.invalidateQueries({ queryKey: queryKeys.sessions.all });
      setDeleteConfirmVisible(false);
      nav.goBack();
    } catch (e: any) {
      setDeleteConfirmVisible(false);
      showSnack(e?.message || "Không thể xóa buổi học.");
    } finally {
      setIsDeleting(false);
    }
  };

  const duration = Math.round((session.end_time - session.start_time) * 60);

  const handleConfirmCancel = async () => {
    setIsCancelling(true);
    setCancelError("");
    try {
      await cancelSession(sessionId, cancelType, cancelReason.trim());
      // Invalidate ALL session-related queries so every list screen
      // (SessionList, TodaySessions, StudentSessions, etc.) refreshes
      // even if it is currently inactive (hidden behind this screen).
      await queryClient.invalidateQueries({
        queryKey: queryKeys.sessions.all,
        refetchType: "all",
      });
      // Also refresh parent-side timetable / home queries when in parent mode.
      if (isParent) {
        await queryClient.invalidateQueries({
          queryKey: queryKeys.parent.all,
          refetchType: "all",
        });
      }
      setCancelModalVisible(false);
      setCancelReason("");
      setCancelType(defaultCancelType);
      refetch();
      showSnack("Đã hủy buổi học");
    } catch (e: any) {
      setCancelError(e?.message || "Không thể hủy buổi học. Vui lòng thử lại.");
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={refetch} />
        }
      >
        {/* ── SESSION INFO CARD ─────────────────────────────── */}
        <View
          style={[styles.infoCard, { backgroundColor: theme.colors.surface }]}
        >
          <LinearGradient
            colors={[G1, G2]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.cardHeader}
          >
            <View style={styles.timeBlock}>
              <View style={{ width: "70%" }}>
                <MaterialCommunityIcons
                  name="clock-outline"
                  size={14}
                  color="rgba(255,255,255,0.75)"
                />
                <Text style={styles.timeText}>
                  {formatFloatTime(session.start_time)}
                  <Text style={styles.timeSep}> – </Text>
                  {formatFloatTime(session.end_time)}
                </Text>
              </View>
              <View style={styles.durationPill}>
                <Text style={styles.durationText}>{duration} phút</Text>
              </View>
            </View>
            <View style={styles.headerMeta}>
              <Text style={styles.sessionCode}>{session.name}</Text>
              <StatusBadge status={session.status} size="small" />
            </View>
          </LinearGradient>

          <View style={styles.studentRow}>
            <View style={styles.avatarRing}>
              <AvatarLabel
                uri={session.student_avatar_url}
                name={studentName}
                size={42}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={[styles.studentName, { color: theme.colors.onSurface }]}
              >
                {studentName}
              </Text>
              <Text
                style={[styles.studentSub, { color: theme.colors.outline }]}
              >
                Học sinh
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.divider,
              { backgroundColor: theme.colors.outlineVariant },
            ]}
          />

          <View style={styles.infoRows}>
            <View style={styles.infoRowGrid}>
              <View style={styles.infoRowCol}>
                <InfoRow
                  icon="calendar-outline"
                  label="Ngày học"
                  value={formatDate(session.session_date)}
                  accent
                />
              </View>
              <View style={styles.infoRowCol}>
                <InfoRow
                  icon="shape-outline"
                  label="Loại buổi"
                  value={
                    SESSION_TYPE_SHORT_LABELS[session.session_type ?? ""] || "—"
                  }
                />
              </View>
            </View>
            <View style={styles.infoRowGrid}>
              <View style={styles.infoRowCol}>
                <InfoRow
                  icon="flag-outline"
                  label="Mục đích"
                  value={
                    SESSION_PURPOSE_LABELS[session.session_purpose ?? ""] || "—"
                  }
                />
              </View>
            </View>
          </View>

          {/* Cancelled banner */}
          {isCancelled && (
            <>
              <View
                style={[
                  styles.divider,
                  { backgroundColor: theme.colors.outlineVariant },
                ]}
              />
              <View
                style={[
                  styles.cancelBanner,
                  { backgroundColor: theme.colors.errorContainer },
                ]}
              >
                <MaterialCommunityIcons
                  name="cancel"
                  size={16}
                  color={theme.colors.error}
                />
                <Text
                  variant="labelMedium"
                  style={{
                    color: theme.colors.onErrorContainer,
                    marginLeft: 8,
                    flex: 1,
                    fontWeight: "700",
                  }}
                >
                  Buổi học đã bị hủy
                </Text>
              </View>
              <View style={[styles.infoRows, { paddingTop: 0 }]}>
                <InfoRow
                  icon="alert-circle-outline"
                  label="Lý do hủy"
                  value={CANCEL_TYPE_LABELS[session.cancel_type ?? ""] || "—"}
                />
                {session.cancel_notes ? (
                  <InfoRow
                    icon="note-text-outline"
                    label="Ghi chú hủy"
                    value={session.cancel_notes}
                  />
                ) : null}
              </View>
            </>
          )}
        </View>

        {/* ── Objectives ─────────────────────────────────────── */}
        {objectivesLoading && (session.objective_ids?.length ?? 0) > 0 ? (
          <SessionObjectivesSkeleton
            count={Math.min(session.objective_ids?.length ?? 2, 3)}
          />
        ) : sessionObjectives.length > 0 ? (
          <>
            <SectionHeader
              icon="target"
              title={`Mục Tiêu Buổi Học (${sessionObjectives.length})`}
            />
            {sessionObjectives.map((obj) => (
              <ObjectiveDetailCard key={obj.id} objective={obj} />
            ))}
          </>
        ) : null}

        {/* ── Results (teacher only) ─────────────────────────── */}
        {!isParent && isDone && resultsLoading ? (
          <SessionResultsSkeleton count={2} />
        ) : !isParent && isDone && results.length > 0 ? (
          <>
            <SectionHeader
              icon="chart-bar"
              title={`Kết Quả Đánh Giá (${results.length})`}
            />
            <View
              style={[
                styles.avgCard,
                { backgroundColor: theme.colors.primaryContainer },
              ]}
            >
              <Text variant="bodyMedium">
                Trung bình: {Math.round(session.avg_accuracy || 0)}% ·{" "}
                {results.length} mục tiêu
              </Text>
            </View>
            {results.map((r: SessionResult) => (
              <ResultSummaryCard key={r.id} result={r} />
            ))}
          </>
        ) : null}

        {/* ── Cancel modal ───────────────────────────────────── */}
        <Modal
          visible={cancelModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setCancelModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.modalCard,
                { backgroundColor: theme.colors.surface },
              ]}
            >
              <Text
                variant="titleMedium"
                style={{ fontWeight: "700", marginBottom: 12 }}
              >
                Hủy buổi học
              </Text>
              <Text
                variant="bodySmall"
                style={{
                  color: theme.colors.onSurfaceVariant,
                  marginBottom: 16,
                }}
              >
                Chọn lý do hủy buổi học:
              </Text>
              <RadioButton.Group
                onValueChange={(val) => setCancelType(val)}
                value={cancelType}
              >
                {cancelOptions.map((opt) => (
                  <View key={opt.value} style={styles.radioRow}>
                    <RadioButton value={opt.value} />
                    <Text variant="bodyMedium">{opt.label}</Text>
                  </View>
                ))}
              </RadioButton.Group>
              <Text
                variant="labelSmall"
                style={{
                  color: theme.colors.outline,
                  marginTop: 12,
                  marginBottom: 4,
                }}
              >
                Ghi chú (không bắt buộc)
              </Text>
              <RNTextInput
                value={cancelReason}
                onChangeText={setCancelReason}
                placeholder="Nhập ghi chú thêm..."
                placeholderTextColor={theme.colors.onSurfaceVariant}
                multiline
                numberOfLines={3}
                style={[
                  styles.reasonInput,
                  {
                    borderColor: theme.colors.outlineVariant,
                    color: theme.colors.onSurface,
                    backgroundColor: theme.colors.surfaceVariant,
                  },
                ]}
              />
              {cancelError ? (
                <Text
                  variant="labelSmall"
                  style={{ color: theme.colors.error, marginTop: 8 }}
                >
                  {cancelError}
                </Text>
              ) : null}
              <View style={styles.modalActions}>
                <Button
                  mode="outlined"
                  onPress={() => {
                    setCancelModalVisible(false);
                    setCancelError("");
                  }}
                  style={{ flex: 1 }}
                  disabled={isCancelling}
                >
                  Đóng
                </Button>
                <Button
                  mode="contained"
                  buttonColor={theme.colors.error}
                  onPress={handleConfirmCancel}
                  style={{ flex: 1, marginLeft: 8 }}
                  disabled={isCancelling}
                  icon={isCancelling ? undefined : "cancel"}
                >
                  {isCancelling ? (
                    <ActivityIndicator size={16} color={theme.colors.onError} />
                  ) : (
                    "Xác nhận hủy"
                  )}
                </Button>
              </View>
            </View>
          </View>
        </Modal>

        {/* ── Schedule Error Modal ───────────────────────────── */}
        {!isParent && (
          <Modal
            visible={scheduleErrorModal !== null}
            transparent
            animationType="fade"
            onRequestClose={() => setScheduleErrorModal(null)}
          >
            <View style={styles.modalOverlay}>
              <View
                style={[
                  styles.modalCard,
                  { backgroundColor: theme.colors.surface },
                ]}
              >
                <View style={styles.errorModalIcon}>
                  <MaterialCommunityIcons
                    name="calendar-alert"
                    size={36}
                    color={theme.colors.error}
                  />
                </View>
                <Text
                  variant="titleMedium"
                  style={{
                    fontWeight: "700",
                    textAlign: "center",
                    marginBottom: 8,
                  }}
                >
                  Không thể lên lịch
                </Text>
                <Text
                  variant="bodySmall"
                  style={{
                    color: theme.colors.onSurfaceVariant,
                    textAlign: "center",
                    marginBottom: 20,
                    lineHeight: 20,
                  }}
                >
                  {scheduleErrorModal}
                </Text>
                <Button
                  mode="contained"
                  onPress={() => setScheduleErrorModal(null)}
                  style={{ width: "100%" }}
                >
                  Đã hiểu
                </Button>
              </View>
            </View>
          </Modal>
        )}

        {/* ── Delete Confirm Modal ───────────────────────────── */}
        {!isParent && (
          <Modal
            visible={deleteConfirmVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setDeleteConfirmVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View
                style={[
                  styles.modalCard,
                  { backgroundColor: theme.colors.surface },
                ]}
              >
                <View style={styles.errorModalIcon}>
                  <MaterialCommunityIcons
                    name="delete-alert-outline"
                    size={36}
                    color={theme.colors.error}
                  />
                </View>
                <Text
                  variant="titleMedium"
                  style={{
                    fontWeight: "700",
                    textAlign: "center",
                    marginBottom: 8,
                  }}
                >
                  Xóa buổi học?
                </Text>
                <Text
                  variant="bodySmall"
                  style={{
                    color: theme.colors.onSurfaceVariant,
                    textAlign: "center",
                    marginBottom: 20,
                    lineHeight: 20,
                  }}
                >
                  Bạn có chắc muốn xóa buổi học này không? Thao tác này không
                  thể hoàn tác.
                </Text>
                <View style={styles.modalActions}>
                  <Button
                    mode="outlined"
                    onPress={() => setDeleteConfirmVisible(false)}
                    style={{ flex: 1 }}
                    disabled={isDeleting}
                  >
                    Hủy bỏ
                  </Button>
                  <Button
                    mode="contained"
                    buttonColor={theme.colors.error}
                    onPress={handleDelete}
                    style={{ flex: 1, marginLeft: 8 }}
                    disabled={isDeleting}
                    icon={isDeleting ? undefined : "delete"}
                  >
                    {isDeleting ? (
                      <ActivityIndicator
                        size={16}
                        color={theme.colors.onError}
                      />
                    ) : (
                      "Xóa"
                    )}
                  </Button>
                </View>
              </View>
            </View>
          </Modal>
        )}

        {/* ── Action buttons ─────────────────────────────────── */}
        <View style={styles.actions}>
          {canSchedule && (
            <Button
              mode="contained"
              icon="calendar-check"
              loading={isScheduling}
              disabled={isScheduling}
              onPress={handleSchedule}
            >
              Lên lịch buổi học
            </Button>
          )}
          {canEval && (
            <Button
              mode="contained"
              icon="clipboard-edit-outline"
              onPress={() => nav.toEval?.(sessionId)}
            >
              {session.status === "completed"
                ? "Tiếp tục nhập kết quả"
                : "Nhập kết quả buổi học"}
            </Button>
          )}
          {canEdit && (
            <Button
              mode="outlined"
              icon="pencil"
              onPress={() => nav.toEdit?.(sessionId)}
              style={{ marginTop: 8 }}
            >
              Chỉnh sửa
            </Button>
          )}
          {canCancel && (
            <Button
              mode="outlined"
              icon="cancel"
              textColor={theme.colors.error}
              style={{ marginTop: 8, borderColor: theme.colors.error }}
              onPress={() => {
                setCancelError("");
                setCancelModalVisible(true);
              }}
            >
              Hủy buổi học
            </Button>
          )}
          {canDelete && (
            <Button
              mode="outlined"
              icon="delete-outline"
              textColor={theme.colors.error}
              style={{ marginTop: 8, borderColor: theme.colors.error }}
              onPress={() => setDeleteConfirmVisible(true)}
            >
              Xóa buổi học
            </Button>
          )}
          {canReport && existingReport ? (
            <Button
              mode="contained"
              icon="file-document-outline"
              onPress={() => nav.toReport?.(existingReport.id)}
              style={{ marginTop: 8 }}
            >
              Xem báo cáo đã gửi
            </Button>
          ) : canReport ? (
            <Button
              mode="contained"
              icon="file-document-edit-outline"
              onPress={() => nav.toCreateReport?.(sessionId)}
              style={{ marginTop: 8 }}
            >
              Tạo báo cáo buổi học
            </Button>
          ) : null}
        </View>
      </ScrollView>

      <Snackbar
        visible={snackVisible}
        onDismiss={() => setSnackVisible(false)}
        duration={3000}
        style={{ marginBottom: 8 }}
      >
        {snackMessage}
      </Snackbar>
    </View>
  );
}

export function SharedSessionDetailScreen(props: Props) {
  return (
    <Suspense fallback={<SessionDetailSkeleton />}>
      <SessionDetailContent {...props} />
    </Suspense>
  );
}

// ── InfoRow ────────────────────────────────────────────────────
function InfoRow({
  icon,
  label,
  value,
  accent = false,
}: {
  icon: string;
  label: string;
  value: string;
  accent?: boolean;
}) {
  const theme = useTheme();
  return (
    <View style={styles.infoRowNew}>
      <View
        style={[
          styles.infoIconWrap,
          { backgroundColor: accent ? G_LIGHT : theme.colors.surfaceVariant },
        ]}
      >
        <MaterialCommunityIcons
          name={icon as any}
          size={15}
          color={accent ? G1 : theme.colors.onSurfaceVariant}
        />
      </View>
      <View style={styles.infoRowContent}>
        <Text style={[styles.infoLabel, { color: theme.colors.outline }]}>
          {label}
        </Text>
        <Text style={[styles.infoValue, { color: theme.colors.onSurface }]}>
          {value}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 32 },

  infoCard: {
    borderRadius: 18,
    overflow: "hidden",
    marginBottom: 20,
    ...Platform.select({
      android: { elevation: 5 },
    }),
  },
  cardHeader: { paddingHorizontal: 16, paddingVertical: 14, gap: 8 },
  timeBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    justifyContent: "space-between",
  },
  timeText: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.4,
  },
  timeSep: { fontSize: 20, fontWeight: "300", color: "rgba(255,255,255,0.65)" },
  durationPill: {
    backgroundColor: "rgba(255,255,255,0.22)",
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 3,
    marginLeft: 4,
  },
  durationText: { fontSize: 12, fontWeight: "700", color: "#fff" },
  headerMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sessionCode: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.80)",
    letterSpacing: 0.4,
  },

  studentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  avatarRing: {
    borderRadius: 24,
    borderWidth: 2,
    borderColor: G_LIGHT,
    overflow: "hidden",
  },
  studentName: { fontSize: 15, fontWeight: "700", letterSpacing: 0.1 },
  studentSub: { fontSize: 11, fontWeight: "500", marginTop: 1 },

  divider: { height: StyleSheet.hairlineWidth, marginHorizontal: 16 },

  infoRows: { paddingHorizontal: 14, paddingVertical: 12, gap: 10 },
  infoRowGrid: { flexDirection: "row", gap: 8 },
  infoRowCol: { flex: 1 },
  infoRowNew: { flexDirection: "row", alignItems: "center", gap: 10 },
  infoIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  infoRowContent: { flex: 1 },
  infoLabel: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 1,
  },
  infoValue: { fontSize: 13, fontWeight: "500" },

  cancelBanner: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    padding: 10,
    marginHorizontal: 14,
    marginTop: 12,
    marginBottom: 4,
  },

  avgCard: { padding: 12, borderRadius: 10, marginBottom: 8 },

  actions: { marginBottom: 24 },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalCard: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
    elevation: 8,
  },
  radioRow: { flexDirection: "row", alignItems: "center", marginVertical: 2 },
  reasonInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    minHeight: 72,
    textAlignVertical: "top",
  },
  modalActions: { flexDirection: "row", marginTop: 16 },
  errorModalIcon: { alignItems: "center", marginBottom: 12 },
});
