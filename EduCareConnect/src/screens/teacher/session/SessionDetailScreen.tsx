import React, { useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Modal,
  Alert,
  TextInput as RNTextInput,
  TouchableOpacity,
} from "react-native";
import {
  Text,
  Button,
  Divider,
  useTheme,
  RadioButton,
  ActivityIndicator,
  Snackbar,
  Chip,
} from "react-native-paper";
import { cancelSession, scheduleSession } from "../../../api/sessionApi";
import { useQueryClient } from "@tanstack/react-query";
import { AvatarLabel } from "../../../components/common/AvatarLabel";
import { StatusBadge } from "../../../components/common/StatusBadge";
import { SectionHeader } from "../../../components/common/SectionHeader";
import { ResultSummaryCard } from "../../../components/session/ResultSummaryCard";
import { LoadingOverlay } from "../../../components/common/LoadingOverlay";
import {
  useSessionDetail,
  useSessionResults,
  useSessionObjectives,
} from "../../../hooks/useSessions";
import { useReportForSession } from "../../../hooks/useReports";
import { formatDate, formatFloatTime } from "../../../utils/formatters";
import { logger } from "../../../utils/logger";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { SessionStackParamList } from "../../../navigation/types";
import { IepObjectiveListItem, SessionResult } from "@/src/types/models";
import { MaterialCommunityIcons } from "@expo/vector-icons";

type Props = NativeStackScreenProps<SessionStackParamList, "SessionDetail">;

const OBSERVATION_LABELS: Record<string, Record<string, string>> = {
  attendance: {
    present: "Có mặt",
    absent_excused: "Vắng có phép",
    absent_unexcused: "Vắng không phép",
    cancelled_center: "Huỷ bởi trung tâm",
    cancelled_family: "Huỷ bởi gia đình",
  },
  mood: {
    very_good: "Rất tốt",
    good: "Tốt",
    neutral: "Bình thường",
    difficult: "Khó khăn",
    very_difficult: "Rất khó khăn",
  },
  energy_level: { high: "Cao", normal: "Bình thường", low: "Thấp" },
  engagement_level: {
    highly_engaged: "Rất tập trung",
    engaged: "Tham gia",
    somewhat_engaged: "Tham gia một phần",
    disengaged: "Không tham gia",
  },
  overall_performance: {
    excellent: "Xuất sắc",
    good: "Tốt",
    fair: "Bình thường",
    poor: "Kém",
  },
};

const TYPE_LABEL: Record<string, string> = {
  individual: "1:1",
  small_group: "Nhóm nhỏ",
  consultation: "Tư vấn",
};

const LOCATION_LABEL: Record<string, string> = {
  center: "Tại trung tâm",
  home: "Tại nhà",
  school: "Tại trường",
  online: "Online",
};

const PURPOSE_LABEL: Record<string, string> = {
  intervention: "Can thiệp",
  maintenance_probe: "Đánh giá duy trì",
  generalization_probe: "Đánh giá tổng quát hóa",
  parent_training: "Hướng dẫn phụ huynh",
};

export function SessionDetailScreen({ route, navigation }: Props) {
  const { sessionId } = route.params;
  const theme = useTheme();
  const queryClient = useQueryClient();
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelType, setCancelType] = useState<
    "cancelled_center" | "cancelled_family"
  >("cancelled_center");
  const [cancelReason, setCancelReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [cancelError, setCancelError] = useState("");
  const [snackMessage, setSnackMessage] = useState("");
  const [snackVisible, setSnackVisible] = useState(false);

  const showSnack = (msg: string) => {
    setSnackMessage(msg);
    setSnackVisible(true);
  };
  const {
    data: session,
    isLoading,
    isError,
    error,
    refetch,
  } = useSessionDetail(sessionId);
  const { data: results = [] } = useSessionResults(
    session?.status === "done" ? sessionId : 0,
  );
  const { data: existingReport } = useReportForSession(
    session?.status === "done" ? sessionId : 0,
  );
  const { data: sessionObjectives = [] } = useSessionObjectives(
    session?.objective_ids ?? [],
  );

  if (isLoading && !session) return <LoadingOverlay visible />;

  if (isError || (!isLoading && !session)) {
    const errorMsg =
      (error as any)?.message || "Không thể tải thông tin buổi học.";
    logger.error("SessionDetailScreen", `render error state`, {
      sessionId,
      errorMsg,
      odooError: (error as any)?.odooError,
    });
    return (
      <View style={styles.errorContainer}>
        <Text
          variant="titleSmall"
          style={{
            color: theme.colors.error,
            textAlign: "center",
            marginBottom: 8,
          }}
        >
          Không tải được buổi học #{sessionId}
        </Text>
        <Text
          variant="bodySmall"
          style={{
            color: theme.colors.onSurfaceVariant,
            textAlign: "center",
            marginBottom: 16,
            paddingHorizontal: 24,
          }}
        >
          {errorMsg}
        </Text>
        <Button mode="contained" onPress={() => refetch()} icon="refresh">
          Thử lại
        </Button>
        <Button
          mode="text"
          onPress={() => navigation.goBack()}
          style={{ marginTop: 8 }}
        >
          Quay lại
        </Button>
      </View>
    );
  }

  if (!session) return null;

  const studentName =
    session.student_name ||
    (Array.isArray(session.student_id) ? session.student_id[1] : "");
  const isCancelled = session.status === "cancelled";
  const isDone = session.status === "done";
  const canSchedule = session.status === "draft";
  const canEval =
    session.status === "scheduled" || session.status === "completed";
  const canEdit = session.status === "draft" || session.status === "scheduled";
  const canCancel =
    session.status === "draft" || session.status === "scheduled";

  const handleSchedule = async () => {
    setIsScheduling(true);
    try {
      await scheduleSession(sessionId);
      await queryClient.invalidateQueries({ queryKey: ["session", sessionId] });
      await queryClient.invalidateQueries({ queryKey: ["sessions"] });
      refetch();
      showSnack("Đã lên lịch buổi học thành công");
    } catch (e: any) {
      Alert.alert("Lỗi", e?.message || "Không thể lên lịch buổi học.");
    } finally {
      setIsScheduling(false);
    }
  };
  const duration = Math.round((session.end_time - session.start_time) * 60);

  const handleConfirmCancel = async () => {
    setIsCancelling(true);
    setCancelError("");
    try {
      await cancelSession(sessionId, cancelType, cancelReason.trim());
      await queryClient.invalidateQueries({ queryKey: ["session", sessionId] });
      await queryClient.invalidateQueries({ queryKey: ["sessions"] });
      setCancelModalVisible(false);
      setCancelReason("");
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
        {/* Header */}
        <View
          style={[styles.header, { backgroundColor: theme.colors.surface }]}
        >
          <Text variant="titleMedium" style={{ fontWeight: "700" }}>
            {session.name}
          </Text>
          <StatusBadge status={session.status} />
        </View>

        {/* Info section */}
        <SectionHeader icon="information-outline" title="Thông Tin Buổi Học" />
        <View
          style={[styles.infoCard, { backgroundColor: theme.colors.surface }]}
        >
          <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
            <AvatarLabel
              uri={session.student_avatar_url}
              name={studentName}
              size={40}
            />
            <Text variant="bodyMedium" style={{ fontWeight: "600" }}>
              {studentName}
            </Text>
          </View>
          <Divider style={{ marginVertical: 8 }} />
          <InfoRow label="Ngày" value={formatDate(session.session_date)} />
          <InfoRow
            label="Thời gian"
            value={`${formatFloatTime(session.start_time)} – ${formatFloatTime(session.end_time)} (${duration} phút)`}
          />
          <InfoRow
            label="Địa điểm"
            value={LOCATION_LABEL[session.location ?? ""] || ""}
          />
          <InfoRow
            label="Loại"
            value={TYPE_LABEL[session.session_type ?? ""] || ""}
          />
          <InfoRow
            label="Mục đích"
            value={PURPOSE_LABEL[session.session_purpose ?? ""] || ""}
          />

          {isCancelled && (
            <>
              <Divider style={{ marginVertical: 8 }} />
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
                    marginLeft: 6,
                    flex: 1,
                    fontWeight: "700",
                  }}
                >
                  Buổi học đã bị hủy
                </Text>
              </View>
              <InfoRow
                label="Lý do hủy"
                value={
                  OBSERVATION_LABELS.attendance[session.attendance ?? ""] || ""
                }
              />
              {session.notes ? (
                <InfoRow label="Ghi chú" value={session.notes} />
              ) : null}
            </>
          )}

          {isDone && (
            <>
              <Divider style={{ marginVertical: 8 }} />
              <InfoRow
                label="Điểm danh"
                value={
                  OBSERVATION_LABELS.attendance[session.attendance ?? ""] || ""
                }
              />
              <InfoRow
                label="Tâm trạng"
                value={OBSERVATION_LABELS.mood[session.mood ?? ""] || ""}
              />
              <InfoRow
                label="Năng lượng"
                value={
                  OBSERVATION_LABELS.energy_level[session.energy_level ?? ""] ||
                  ""
                }
              />
              <InfoRow
                label="Tập trung"
                value={
                  OBSERVATION_LABELS.engagement_level[
                    session.engagement_level ?? ""
                  ] || ""
                }
              />
              <InfoRow
                label="Kết quả tổng"
                value={
                  OBSERVATION_LABELS.overall_performance[
                    session.overall_performance ?? ""
                  ] || ""
                }
              />
            </>
          )}
        </View>

        {/* Objectives taught in session */}
        {sessionObjectives.length > 0 && (
          <>
            <SectionHeader
              icon="target"
              title={`Mục Tiêu Buổi Học (${sessionObjectives.length})`}
            />
            {sessionObjectives.map((obj) => (
              <ObjectiveDetailCard key={obj.id} objective={obj} />
            ))}
          </>
        )}

        {/* Results section (done) */}
        {isDone && results.length > 0 && (
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
            {/* <Button
              mode="outlined"
              icon="magnify"
              onPress={() =>
                navigation.navigate("EvalDetailView", { sessionId })
              }
              style={{ marginTop: 8 }}
            >
              Xem chi tiết đánh giá
            </Button> */}
          </>
        )}

        {/* Cancel session modal */}
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
                onValueChange={(val) =>
                  setCancelType(val as "cancelled_center" | "cancelled_family")
                }
                value={cancelType}
              >
                <View style={styles.radioRow}>
                  <RadioButton value="cancelled_center" />
                  <Text variant="bodyMedium">Trung tâm hủy</Text>
                </View>
                <View style={styles.radioRow}>
                  <RadioButton value="cancelled_family" />
                  <Text variant="bodyMedium">Gia đình hủy</Text>
                </View>
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
                placeholder="Nhập lý do hủy..."
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

        {/* Action buttons */}
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
              onPress={() => navigation.navigate("EvalStep1", { sessionId })}
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
              onPress={() => navigation.navigate("SessionEdit", { sessionId })}
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
          {isDone && existingReport ? (
            <Button
              mode="contained"
              icon="file-document-outline"
              onPress={() => {
                navigation.getParent()?.navigate("ReportTab" as any, {
                  screen: "ReportDetail",
                  params: { reportId: existingReport.id },
                });
              }}
              style={{ marginTop: 8 }}
            >
              Xem báo cáo đã gửi
            </Button>
          ) : isDone ? (
            <Button
              mode="contained"
              icon="file-document-edit-outline"
              onPress={() => {
                navigation.getParent()?.navigate("ReportTab" as any, {
                  screen: "ReportCreate",
                  params: { sessionId },
                });
              }}
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

function ObjectiveDetailCard({
  objective,
}: {
  objective: IepObjectiveListItem;
}) {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);
  const domains = Array.isArray(objective.domain_ids)
    ? (objective.domain_ids as any[]).filter(Boolean)
    : [];

  return (
    <TouchableOpacity
      onPress={() => setExpanded((v) => !v)}
      activeOpacity={0.8}
    >
      <View
        style={[
          styles.objectiveCard,
          { backgroundColor: theme.colors.surface },
        ]}
      >
        <View style={styles.objectiveHeader}>
          <View style={{ flex: 1 }}>
            <Text variant="labelSmall" style={{ color: theme.colors.primary }}>
              {objective.objective_code}
            </Text>
            <Text
              variant="bodyMedium"
              style={{ fontWeight: "600", marginTop: 2 }}
            >
              {objective.name}
            </Text>
          </View>
          <MaterialCommunityIcons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={20}
            color={theme.colors.onSurfaceVariant}
          />
        </View>

        {/* Domain chips */}
        {domains.length > 0 && (
          <View style={styles.chipRow}>
            {domains.map((d: any) => (
              <Chip
                key={typeof d === "object" ? d.id : d}
                compact
                style={{ marginRight: 4, marginTop: 4 }}
                textStyle={{ fontSize: 11 }}
              >
                {typeof d === "object" ? (d[1] ?? d.name ?? d.id) : d}
              </Chip>
            ))}
          </View>
        )}

        {objective.description ? (
          <Text
            variant="bodySmall"
            style={{ color: theme.colors.onSurfaceVariant, marginTop: 6 }}
            numberOfLines={expanded ? undefined : 2}
          >
            {objective.description}
          </Text>
        ) : null}

        {expanded && (
          <>
            <Divider style={{ marginVertical: 8 }} />
            {objective.measurement_method ? (
              <DetailRow
                icon="ruler"
                label="Phương pháp đo lường"
                value={objective.measurement_method}
              />
            ) : null}
            {objective.implementation_steps ? (
              <DetailRow
                icon="format-list-checks"
                label="Các bước thực hiện"
                value={objective.implementation_steps}
              />
            ) : null}
            {objective.materials_needed ? (
              <DetailRow
                icon="package-variant-closed"
                label="Vật liệu cần thiết"
                value={objective.materials_needed}
              />
            ) : null}
            {objective.consecutive_sessions_required ? (
              <DetailRow
                icon="calendar-check-outline"
                label="Buổi đạt liên tiếp"
                value={`${objective.consecutive_sessions_achieved || 0}/${objective.consecutive_sessions_required} buổi`}
              />
            ) : null}
            {objective.smart_specific ? (
              <DetailRow
                icon="target"
                label="Cụ thể (S)"
                value={objective.smart_specific}
              />
            ) : null}
            {objective.smart_measurable ? (
              <DetailRow
                icon="chart-line"
                label="Đo lường (M)"
                value={objective.smart_measurable}
              />
            ) : null}
            {objective.smart_analysis ? (
              <DetailRow
                icon="check-decagram-outline"
                label="Khả thi (A/R)"
                value={objective.smart_analysis}
              />
            ) : null}
            {objective.smart_timebound ? (
              <DetailRow
                icon="clock-outline"
                label="Thời hạn (T)"
                value={objective.smart_timebound}
              />
            ) : null}
            {typeof objective.difficulty_level === "number" ? (
              <DetailRow
                icon="alert-circle-outline"
                label="Độ khó"
                value={`${objective.difficulty_level}/5`}
              />
            ) : null}
            {objective.suggested_prompt_level_id &&
            typeof objective.suggested_prompt_level_id === "object" ? (
              <DetailRow
                icon="account-question-outline"
                label="Mức gợi ý"
                value={(objective.suggested_prompt_level_id as any)[1] ?? ""}
              />
            ) : null}
          </>
        )}
      </View>
    </TouchableOpacity>
  );
}

function DetailRow({
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
    <View style={styles.detailRow}>
      <MaterialCommunityIcons
        name={icon as any}
        size={15}
        color={theme.colors.primary}
        style={{ marginRight: 6, marginTop: 2 }}
      />
      <View style={{ flex: 1 }}>
        <Text
          variant="labelSmall"
          style={{ color: theme.colors.outline, marginBottom: 1 }}
        >
          {label}
        </Text>
        <Text variant="bodySmall">{value}</Text>
      </View>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  return (
    <View style={styles.infoRow}>
      <Text
        variant="labelSmall"
        style={{ color: theme.colors.outline, width: 100 }}
      >
        {label}
      </Text>
      <Text variant="bodySmall">{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 32 },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 1,
  },
  infoCard: { padding: 16, borderRadius: 12, elevation: 1, marginBottom: 16 },
  infoRow: { flexDirection: "row", marginVertical: 2 },
  objectiveCard: {
    padding: 14,
    borderRadius: 12,
    elevation: 1,
    marginBottom: 10,
  },
  objectiveHeader: { flexDirection: "row", alignItems: "flex-start" },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginVertical: 4,
  },
  chipRow: { flexDirection: "row", flexWrap: "wrap" },
  cancelBanner: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    padding: 10,
    marginBottom: 6,
  },
  avgCard: { padding: 12, borderRadius: 10, marginBottom: 8 },
  actions: { marginTop: 24 },
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
  radioRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 2,
  },
  reasonInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    minHeight: 72,
    textAlignVertical: "top",
  },
  modalActions: {
    flexDirection: "row",
    marginTop: 16,
  },
});
