import React, { useState, useEffect } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { toast } from "@utils/toast";
import {
  Text,
  Button,
  Surface,
  useTheme,
  Modal,
  Portal,
} from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StackActions } from "@react-navigation/native";
import { useQueryClient } from "@tanstack/react-query";
import { useEvalStore } from "@store/evalStore";
import { useSubmitEval } from "@hooks/useEval";
import { useSessionDetail, useSessionObjectives } from "@hooks/useSessions";
import {
  formatDate,
  formatFloatTime,
  formatDuration,
  formatDurationSeconds,
} from "@utils/formatters";
import { MEASUREMENT_TYPE_LABELS } from "@utils/labels";
import { queryKeys } from "@api/queryKeys";
import type { ResultInput, IepCompletionSignal } from "@api/evalApi";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { TeacherSessionStackParamList } from "@navigation/types";
import { SafeAreaView } from "react-native-safe-area-context";
import { callKw } from "@api/odooClient";

type ModalStep = "main" | "confirm_continue" | "confirm_end";

type Props = NativeStackScreenProps<
  TeacherSessionStackParamList,
  "EvalConfirm"
>;

function getAccuracyMeta(accuracy: number, theme: any) {
  if (accuracy >= 80) return { color: "#2E7D32", bg: "#E8F5E9", label: "Tốt" };
  if (accuracy >= 50)
    return { color: "#E65100", bg: "#FFF3E0", label: "Trung bình" };
  return { color: theme.colors.error, bg: "#FFEBEE", label: "Cần cải thiện" };
}

export function EvalConfirmScreen({ route, navigation }: Props) {
  const { sessionId } = route.params;
  const theme = useTheme();
  const { data: session } = useSessionDetail(sessionId);
  const { data: sessionObjectives = [] } = useSessionObjectives(
    session?.objective_ids ?? [],
  );
  const results = useEvalStore((s) => s.results);
  const skippedObjectiveIds = useEvalStore((s) => s.skippedObjectiveIds);
  const reset = useEvalStore((s) => s.reset);
  const storeSessionId = useEvalStore((s) => s.sessionId);
  const submitMutation = useSubmitEval();

  // Defensive guard: if the store still holds a different session's drafts
  // (e.g. user backed out of session A's confirm without submitting and
  // somehow landed here for session B), wipe the slate. EvalObjectiveScreen
  // normally handles this on entry; this is a belt-and-braces second check.
  const storeMismatch =
    storeSessionId !== null && storeSessionId !== sessionId;
  useEffect(() => {
    if (storeMismatch) {
      reset();
    }
  }, [storeMismatch, reset]);

  const queryClient = useQueryClient();
  const [iepSignal, setIepSignal] = useState<IepCompletionSignal | null>(null);
  const [modalStep, setModalStep] = useState<ModalStep>("main");
  const [endingIep, setEndingIep] = useState(false);

  const unreviewedSessions =
    iepSignal?.remaining_sessions.filter((s) => s.status === "completed") ?? [];
  const scheduledSessions =
    iepSignal?.remaining_sessions.filter((s) => s.status === "scheduled") ?? [];

  const studentName = Array.isArray(session?.student_id)
    ? session.student_id[1]
    : "";
  // During the mismatch frame (before the reset effect runs), pretend the
  // store is empty so the UI never displays another session's draft results.
  const resultsArray = storeMismatch ? [] : Array.from(results.values());
  const avgAccuracy =
    resultsArray.length > 0
      ? Math.round(
          resultsArray.reduce((sum, r) => sum + (r.score_pct ?? 0), 0) /
            resultsArray.length,
        )
      : 0;

  const navigateToSessionDetail = () => {
    const routes = navigation.getState().routes;
    if (routes.some((r) => r.name === "SessionDetail")) {
      navigation.dispatch(StackActions.popTo("SessionDetail", { sessionId }));
    } else {
      navigation.navigate("SessionDetail", { sessionId });
    }
  };

  const invalidateIepPlans = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.iepPlans.all });
    queryClient.invalidateQueries({ queryKey: ["students", "iep-plans"] });
  };

  const skippedIdsArray = Array.from(skippedObjectiveIds);

  const handleConfirm = async () => {
    // Block submit when nothing left to record — the session would land in
    // "reviewed" state with zero results which is meaningless. Direct the
    // teacher to cancel the session from the detail screen instead.
    if (resultsArray.length === 0) {
      toast.error(
        "Không có mục tiêu nào để đánh giá",
        "Vui lòng đánh giá ít nhất 1 mục tiêu, hoặc hủy buổi học từ màn chi tiết.",
      );
      return;
    }
    try {
      const signal = await submitMutation.mutateAsync({
        sessionId,
        results: resultsArray,
        skippedObjectiveIds: skippedIdsArray,
      });
      reset();
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (signal.iep_just_completed) {
        setModalStep("main");
        setIepSignal(signal);
      } else {
        navigateToSessionDetail();
      }
    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      toast.error("Không thể hoàn thành đánh giá", e?.message);
    }
  };

  const handleEndIep = async () => {
    if (!iepSignal?.plan_id) return;
    setEndingIep(true);
    try {
      await callKw("educare.iep.plan", "action_end_iep_period", [
        [iepSignal.plan_id],
      ]);
      invalidateIepPlans();
      setIepSignal(null);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      toast.success("Kỳ IEP đã kết thúc");
      navigateToSessionDetail();
    } catch (e: any) {
      toast.error("Không thể kết thúc kỳ IEP", e?.message);
    } finally {
      setEndingIep(false);
    }
  };

  const handleContinueMaintenance = async () => {
    if (!iepSignal?.plan_id) return;
    try {
      await callKw("educare.iep.plan", "action_continue_maintenance", [
        [iepSignal.plan_id],
      ]);
      invalidateIepPlans();
      setIepSignal(null);
      toast.success(
        "Đã chuyển sang chế độ duy trì",
        "Các buổi học tiếp theo sẽ được ghi nhận là duy trì. Vào Chi tiết IEP để kết thúc kỳ khi cần.",
      );
      navigateToSessionDetail();
    } catch (e: any) {
      toast.error("Lỗi", e?.message);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* ── Hero summary card ───────────────────────── */}
        <Surface
          style={[
            styles.heroCard,
            { backgroundColor: theme.colors.primaryContainer },
          ]}
          elevation={0}
        >
          {/* ── Top: identity ── */}
          <View style={styles.heroTop}>
            <LinearGradient
              colors={[theme.colors.primary, theme.colors.primaryContainer]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroIconWrap}
            >
              <MaterialCommunityIcons
                name="clipboard-check-outline"
                size={26}
                color="#fff"
              />
            </LinearGradient>

            <View style={{ flex: 1, gap: 3 }}>
              <Text
                style={[styles.heroEyebrow, { color: theme.colors.primary }]}
              >
                XÁC NHẬN KẾT QUẢ
              </Text>
              <Text
                style={[
                  styles.heroTitle,
                  { color: theme.colors.onPrimaryContainer },
                ]}
              >
                Tóm tắt buổi học
              </Text>
            </View>
          </View>

          {/* ── Meta badges ── */}
          <View style={styles.metaBadgeRow}>
            {session?.session_date ? (
              <View
                style={[
                  styles.metaBadge,
                  { backgroundColor: "rgba(255,255,255,0.55)" },
                ]}
              >
                <MaterialCommunityIcons
                  name="calendar-outline"
                  size={12}
                  color={theme.colors.primary}
                />
                <Text
                  style={[
                    styles.metaBadgeText,
                    { color: theme.colors.onPrimaryContainer },
                  ]}
                >
                  {formatDate(session.session_date)}
                </Text>
              </View>
            ) : null}
            {session?.duration ? (
              <View
                style={[
                  styles.metaBadge,
                  { backgroundColor: "rgba(255,255,255,0.55)" },
                ]}
              >
                <MaterialCommunityIcons
                  name="timer-outline"
                  size={12}
                  color={theme.colors.primary}
                />
                <Text
                  style={[
                    styles.metaBadgeText,
                    { color: theme.colors.onPrimaryContainer },
                  ]}
                >
                  {formatDuration(session.duration)}
                </Text>
              </View>
            ) : null}
          </View>
        </Surface>

        {/* ── Per-objective result cards ──────────────── */}
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons
            name="format-list-bulleted"
            size={16}
            color={theme.colors.primary}
          />
          <Text
            variant="labelLarge"
            style={{ fontWeight: "700", color: theme.colors.primary }}
          >
            Kết Quả Mục Tiêu ({resultsArray.length})
          </Text>
        </View>
        {skippedIdsArray.length > 0 ? (
          <Text
            variant="labelSmall"
            style={{
              color: theme.colors.outline,
              marginTop: 4,
              marginBottom: 8,
              fontStyle: "italic",
            }}
          >
            {skippedIdsArray.length} mục tiêu đã bỏ qua — sẽ bị loại khỏi buổi
            học khi bấm Hoàn tất.
          </Text>
        ) : null}

        {resultsArray.map((r, idx) => (
          <ResultCard
            key={r.objective_id}
            index={idx}
            total={resultsArray.length}
            result={r}
            objectives={sessionObjectives}
            theme={theme}
          />
        ))}
      </ScrollView>

      {/* ── Footer ────────────────────────────────── */}
      <SafeAreaView
        style={[styles.footer, { backgroundColor: theme.colors.surface }]}
        edges={["bottom"]}
      >
        <Button
          mode="outlined"
          icon="arrow-left"
          onPress={() => navigation.goBack()}
          style={styles.footerBtn}
          disabled={submitMutation.isPending}
        >
          Quay lại
        </Button>
        <Button
          mode="contained"
          icon="check-circle"
          onPress={handleConfirm}
          loading={submitMutation.isPending}
          disabled={submitMutation.isPending}
          style={styles.footerBtn}
        >
          Hoàn tất
        </Button>
      </SafeAreaView>

      {/* ── IEP Completion Modal ──────────────────── */}
      <Portal>
        <Modal
          visible={!!iepSignal}
          onDismiss={() => {}}
          contentContainerStyle={[
            styles.iepModal,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          {/* Step: main — celebration + choice */}
          {modalStep === "main" && (
            <View style={styles.iepModalContent}>
              <View style={styles.iepIconWrap}>
                <MaterialCommunityIcons
                  name="party-popper"
                  size={48}
                  color="#F9A825"
                />
              </View>
              <Text
                variant="titleLarge"
                style={{
                  fontWeight: "800",
                  textAlign: "center",
                  marginTop: 12,
                  color: "#2E7D32",
                }}
              >
                🎉 Chúc mừng!
              </Text>
              <Text
                variant="bodyMedium"
                style={{
                  textAlign: "center",
                  marginTop: 8,
                  color: theme.colors.onSurfaceVariant,
                  lineHeight: 22,
                }}
              >
                Bé đã hoàn thành toàn bộ mục tiêu trong kế hoạch IEP kỳ này!
              </Text>

              {iepSignal && iepSignal.remaining_sessions.length > 0 && (
                <View
                  style={[
                    styles.remainingBox,
                    { borderColor: theme.colors.outlineVariant },
                  ]}
                >
                  <Text
                    variant="labelSmall"
                    style={{
                      fontWeight: "700",
                      color: theme.colors.outline,
                      marginBottom: 8,
                      letterSpacing: 0.5,
                    }}
                  >
                    BUỔI HỌC CÒN LẠI ({iepSignal.remaining_sessions.length})
                  </Text>
                  {iepSignal.remaining_sessions.map((s) => (
                    <View
                      key={s.id}
                      style={[
                        styles.remainingRow,
                        { backgroundColor: theme.colors.surfaceVariant },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={
                          s.status === "completed"
                            ? "clock-alert-outline"
                            : "calendar-clock"
                        }
                        size={14}
                        color={
                          s.status === "completed"
                            ? theme.colors.error
                            : theme.colors.outline
                        }
                      />
                      <Text
                        variant="bodySmall"
                        style={{ marginLeft: 6, flex: 1 }}
                      >
                        {formatDate(s.session_date)}
                        {"  "}
                        {formatFloatTime(s.start_time)} –{" "}
                        {formatFloatTime(s.end_time)}
                      </Text>
                      {s.status === "completed" && (
                        <Text
                          variant="labelSmall"
                          style={{
                            color: theme.colors.error,
                            fontWeight: "700",
                          }}
                        >
                          Chưa đánh giá
                        </Text>
                      )}
                    </View>
                  ))}
                </View>
              )}

              <Text
                variant="bodySmall"
                style={{
                  textAlign: "center",
                  color: theme.colors.outline,
                  marginTop: 12,
                  lineHeight: 18,
                }}
              >
                Bạn muốn kết thúc kỳ IEP hay tiếp tục dạy để củng cố kỹ năng?
              </Text>

              <View style={styles.iepBtnRow}>
                <Button
                  mode="outlined"
                  onPress={() => setModalStep("confirm_continue")}
                  style={[{ borderColor: theme.colors.primary }]}
                >
                  Tiếp tục củng cố
                </Button>
                <Button
                  mode="contained"
                  onPress={() => setModalStep("confirm_end")}
                  buttonColor="#2E7D32"
                >
                  Kết thúc kỳ IEP
                </Button>
              </View>
            </View>
          )}

          {/* Step: confirm_continue — info about maintenance mode */}
          {modalStep === "confirm_continue" && (
            <View style={styles.iepModalContent}>
              <View
                style={[styles.iepIconWrap, { backgroundColor: "#E3F2FD" }]}
              >
                <MaterialCommunityIcons
                  name="information-outline"
                  size={40}
                  color="#1565C0"
                />
              </View>
              <Text
                variant="titleMedium"
                style={{
                  fontWeight: "800",
                  textAlign: "center",
                  marginTop: 12,
                  color: "#1565C0",
                }}
              >
                Tiếp tục củng cố kỹ năng
              </Text>
              <View
                style={[
                  styles.infoBox,
                  { backgroundColor: "#E3F2FD", borderColor: "#BBDEFB" },
                ]}
              >
                <Text
                  variant="bodySmall"
                  style={{ color: "#0D47A1", lineHeight: 20 }}
                >
                  Từ giờ các buổi học sẽ được ghi nhận là{" "}
                  <Text style={{ fontWeight: "700" }}>duy trì</Text> để củng cố
                  kỹ năng đã đạt được. Kết quả sẽ không ảnh hưởng đến tiến độ
                  IEP.
                </Text>
                <Text
                  variant="bodySmall"
                  style={{ color: "#0D47A1", lineHeight: 20, marginTop: 8 }}
                >
                  Bạn có thể vào trang{" "}
                  <Text style={{ fontWeight: "700" }}>Chi tiết IEP</Text> để kết
                  thúc kỳ bất cứ lúc nào.
                </Text>
              </View>
              <View style={[styles.iepBtnRow, { flexDirection: "row" }]}>
                <Button
                  mode="outlined"
                  onPress={() => setModalStep("main")}
                  style={{ flex: 1 }}
                >
                  Quay lại
                </Button>
                <Button
                  mode="contained"
                  onPress={handleContinueMaintenance}
                  buttonColor="#1565C0"
                  style={{ flex: 1 }}
                >
                  Xác nhận
                </Button>
              </View>
            </View>
          )}

          {/* Step: confirm_end — warning about session cancellation */}
          {modalStep === "confirm_end" && (
            <View style={styles.iepModalContent}>
              <View
                style={[styles.iepIconWrap, { backgroundColor: "#FFF3E0" }]}
              >
                <MaterialCommunityIcons
                  name="alert-outline"
                  size={40}
                  color="#E65100"
                />
              </View>
              <Text
                variant="titleMedium"
                style={{
                  fontWeight: "800",
                  textAlign: "center",
                  marginTop: 12,
                  color: "#BF360C",
                }}
              >
                Kết thúc kỳ IEP?
              </Text>

              {unreviewedSessions.length > 0 && (
                <View
                  style={[
                    styles.infoBox,
                    { backgroundColor: "#FFEBEE", borderColor: "#FFCDD2" },
                  ]}
                >
                  <Text
                    variant="bodySmall"
                    style={{
                      color: "#B71C1C",
                      fontWeight: "700",
                      marginBottom: 4,
                    }}
                  >
                    ⚠ Còn {unreviewedSessions.length} buổi chưa được đánh giá
                  </Text>
                  <Text
                    variant="bodySmall"
                    style={{ color: "#C62828", lineHeight: 20 }}
                  >
                    Vui lòng hoàn thành đánh giá và gửi báo cáo cho tất cả buổi
                    học trước khi kết thúc kỳ.
                  </Text>
                </View>
              )}

              {scheduledSessions.length > 0 && (
                <View
                  style={[
                    styles.infoBox,
                    { backgroundColor: "#FFF3E0", borderColor: "#FFE0B2" },
                  ]}
                >
                  <Text
                    variant="bodySmall"
                    style={{
                      color: "#E65100",
                      fontWeight: "700",
                      marginBottom: 4,
                    }}
                  >
                    {scheduledSessions.length} buổi đã lên lịch sẽ bị hủy
                  </Text>
                  <Text
                    variant="bodySmall"
                    style={{ color: "#BF360C", lineHeight: 20 }}
                  >
                    Sau khi kết thúc, bạn cần tạo kế hoạch IEP mới cho kỳ tiếp
                    theo.
                  </Text>
                </View>
              )}

              {unreviewedSessions.length === 0 &&
                scheduledSessions.length === 0 && (
                  <View
                    style={[
                      styles.infoBox,
                      { backgroundColor: "#FFF3E0", borderColor: "#FFE0B2" },
                    ]}
                  >
                    <Text
                      variant="bodySmall"
                      style={{ color: "#BF360C", lineHeight: 20 }}
                    >
                      Kỳ IEP sẽ được đánh dấu hoàn thành. Bạn cần tạo kế hoạch
                      IEP mới cho kỳ tiếp theo.
                    </Text>
                  </View>
                )}

              <View style={styles.iepBtnRow}>
                <Button
                  mode="outlined"
                  onPress={() => setModalStep("main")}
                  disabled={endingIep}
                >
                  Quay lại
                </Button>
                <Button
                  mode="contained"
                  onPress={handleEndIep}
                  loading={endingIep}
                  disabled={endingIep || unreviewedSessions.length > 0}
                  buttonColor="#BF360C"
                >
                  Xác nhận
                </Button>
              </View>
            </View>
          )}
        </Modal>
      </Portal>
    </View>
  );
}

// ── Per-objective result card ────────────────────────────────────────────────────
function ResultCard({
  index,
  total,
  result,
  objectives,
  theme,
}: {
  index: number;
  total: number;
  result: ResultInput;
  objectives: any[];
  theme: any;
}) {
  const obj = objectives.find((o) => o.id === result.objective_id);
  const mt = result.measurement_type;
  const accuracy = Math.round(result.score_pct ?? 0);
  const acc = getAccuracyMeta(accuracy, theme);
  const typeLabel = MEASUREMENT_TYPE_LABELS[mt] || mt;
  let detailValue = "—";
  if (mt === "accuracy") {
    detailValue = `${result.correct_trials ?? 0}/${result.total_trials ?? 0}`;
  } else if (mt === "prompt_level") {
    detailValue = `${result.trial_prompts?.length ?? 0} lần thử`;
  } else if (mt === "duration") {
    detailValue = formatDurationSeconds(result.actual_duration_seconds ?? 0);
  } else {
    detailValue = `${result.actual_count ?? 0} lần`;
  }
  const code =
    obj?.objective_code ||
    `STO-${String(result.objective_id).padStart(3, "0")}`;

  return (
    <Surface style={styles.resultCard} elevation={1}>
      {/* Top row: index pill + code badge + accuracy chip */}
      <View style={styles.resultTopRow}>
        <View
          style={[
            styles.indexPill,
            { backgroundColor: theme.colors.surfaceVariant },
          ]}
        >
          <Text
            style={[
              styles.indexPillText,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            {index + 1}/{total}
          </Text>
        </View>
        <View
          style={[
            styles.codeBadge,
            { backgroundColor: theme.colors.primaryContainer },
          ]}
        >
          <Text style={[styles.codeText, { color: theme.colors.primary }]}>
            {code}
          </Text>
        </View>
        <View style={{ flex: 1 }} />
        <View style={[styles.accuracyChip, { backgroundColor: acc.bg }]}>
          <Text style={[styles.accuracyChipText, { color: acc.color }]}>
            {accuracy}%
          </Text>
        </View>
      </View>

      {/* Objective name */}
      {obj?.name ? (
        <Text
          variant="bodyMedium"
          style={[styles.objName, { color: theme.colors.onSurface }]}
          numberOfLines={2}
        >
          {obj.name}
        </Text>
      ) : null}

      {/* Accuracy progress bar */}
      <View style={styles.progressSection}>
        <View
          style={[
            styles.progressTrack,
            { backgroundColor: theme.colors.surfaceVariant },
          ]}
        >
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.min(accuracy, 100)}%`,
                backgroundColor: acc.color,
              },
            ]}
          />
        </View>
      </View>

      {/* Stats row */}
      <View
        style={[
          styles.statsRow,
          {
            backgroundColor: theme.colors.surfaceVariant,
            borderColor: theme.colors.outlineVariant,
          },
        ]}
      >
        <View style={styles.statCell}>
          <Text style={styles.statLabel}>Chi tiết</Text>
          <View style={styles.statValueRow}>
            <Text style={[styles.statBig, { color: theme.colors.onSurface }]}>
              {detailValue}
            </Text>
          </View>
        </View>
        <View
          style={[
            styles.vRule,
            { backgroundColor: theme.colors.outlineVariant },
          ]}
        />
        <View style={styles.statCell}>
          <Text style={styles.statLabel}>Kết quả</Text>
          <Text style={[styles.statBig, { color: acc.color }]}>
            {acc.label}
          </Text>
        </View>
        <View
          style={[
            styles.vRule,
            { backgroundColor: theme.colors.outlineVariant },
          ]}
        />
        <View style={[styles.statCell, { flex: 1.3 }]}>
          <Text style={styles.statLabel}>Cách đo</Text>
          <Text
            style={[styles.statBig, { color: theme.colors.onSurface }]}
            numberOfLines={2}
            adjustsFontSizeToFit
            minimumFontScale={0.8}
          >
            {typeLabel}
          </Text>
        </View>
      </View>

      {result.notes ? (
        <View style={styles.notesRow}>
          <MaterialCommunityIcons
            name="note-text-outline"
            size={14}
            color={theme.colors.outline}
            style={{ marginTop: 2 }}
          />
          <Text
            variant="bodySmall"
            style={{ color: theme.colors.onSurfaceVariant, flex: 1 }}
          >
            {result.notes}
          </Text>
        </View>
      ) : null}
    </Surface>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 100 },

  // Hero summary card
  heroCard: {
    borderRadius: 20,
    marginBottom: 16,
    overflow: "hidden",
    padding: 18,
    gap: 12,
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  heroIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  heroEyebrow: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.4,
    textTransform: "uppercase",
    opacity: 0.8,
  },
  heroTitle: {
    fontSize: 21,
    fontWeight: "800",
    letterSpacing: -0.4,
    lineHeight: 27,
  },
  metaBadgeRow: {
    flexDirection: "row",
    gap: 16,
  },
  metaBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
  },
  metaBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  heroSeparator: {
    height: 1,
    borderRadius: 1,
    marginTop: 2,
  },

  // Stats panel — asymmetric layout
  heroStatsPanel: {
    flexDirection: "row",
    borderRadius: 14,
    overflow: "hidden",
    minHeight: 80,
  },
  heroStatPrimary: {
    flex: 1.1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 8,
    gap: 2,
  },
  heroStatBigNumber: {
    fontSize: 38,
    fontWeight: "800",
    letterSpacing: -1.5,
    lineHeight: 42,
  },
  heroStatPrimaryLabel: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.3,
    opacity: 0.75,
  },
  heroStatVDivider: {
    width: 1,
    marginVertical: 12,
  },
  heroStatSecondaryCol: {
    flex: 1,
  },
  heroStatSecondaryItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    gap: 2,
  },
  heroStatSecondaryValue: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.8,
  },
  heroStatSecondaryLabel: {
    fontSize: 10,
    fontWeight: "500",
    opacity: 0.7,
    letterSpacing: 0.2,
  },

  // Section header
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },

  // Result card
  resultCard: {
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    backgroundColor: "#fff",
    gap: 10,
  },
  resultTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  indexPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  indexPillText: { fontSize: 11, fontWeight: "700" },
  codeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  codeText: { fontSize: 11, fontWeight: "700", letterSpacing: 0.3 },
  accuracyChip: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    minWidth: 52,
    alignItems: "center",
  },
  accuracyChipText: { fontSize: 13, fontWeight: "800" },
  objName: { fontWeight: "500", lineHeight: 20 },
  progressSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 3 },

  statsRow: {
    flexDirection: "row",
    borderRadius: 10,
    borderWidth: 1,
    overflow: "hidden",
  },
  statCell: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 4,
    gap: 2,
  },
  statLabel: {
    fontSize: 10,
    color: "#999",
    textAlign: "center",
    fontWeight: "500",
  },
  statValueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 1,
  },
  statBig: {
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
  statSmall: { fontSize: 12, fontWeight: "400" },
  vRule: {
    width: 1,
    alignSelf: "stretch",
    marginVertical: 8,
  },
  notesRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    paddingTop: 4,
  },

  // Footer
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 12,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.06)",
  },
  footerBtn: { flex: 1 },

  // IEP completion modal
  iepModal: { marginHorizontal: 20, borderRadius: 20, overflow: "hidden" },
  iepModalContent: { padding: 24, alignItems: "center" },
  iepIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FFFDE7",
    alignItems: "center",
    justifyContent: "center",
  },
  remainingBox: {
    width: "100%",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
    gap: 6,
  },
  remainingRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  infoBox: {
    width: "100%",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  iepBtnRow: {
    flexDirection: "column",
    gap: 10,
    marginTop: 20,
    width: "100%",
  },
  // iepBtn: { flex: 1 },
});
