import React, { useEffect, useState, useRef } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  Image,
  TouchableOpacity,
  FlatList,
} from "react-native";
import * as Haptics from "expo-haptics";
import { toast } from "@utils/toast";
import {
  TextInput,
  Button,
  Text,
  Divider,
  useTheme,
  Surface,
  Modal,
  Portal,
} from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFocusEffect } from "@react-navigation/native";
import { SessionInfoCard } from "@components/report/SessionInfoCard";
import { LoadingOverlay } from "@components/common/LoadingOverlay";
import {
  usePersistReport,
  usePersistAndSendReport,
  useReportDetail,
} from "@hooks/useReports";
import { fetchSessionDetail, fetchSessionResults } from "@api/sessionApi";
import { PERFORMANCE_LABELS } from "@utils/labels";
import { REPORT_FIELDS } from "@constants/reportFields";
import { formatDate } from "@utils/formatters";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { ReportStackParamList } from "@navigation/types";
import type { PhotoAsset } from "@t";

type Props = NativeStackScreenProps<ReportStackParamList, "ReportCreate">;

// ── Static image assets ──────────────────────────────────────
const EMOJI_MAP: Record<string, ReturnType<typeof require>> = {
  very_good: require("../../../../assets/amoji/happiness.png"),
  good: require("../../../../assets/amoji/cool.png"),
  neutral: require("../../../../assets/amoji/neutral.png"),
  difficult: require("../../../../assets/amoji/sad.png"),
  very_difficult: require("../../../../assets/amoji/angry.png"),
};
const STAR_BLACK = require("../../../../assets/star/star-black.png");
const STAR_YELLOW = require("../../../../assets/star/star-yellow.png");
const ENGAGE_BORED = require("../../../../assets/engagement_level/bored.png");
const ENGAGE_SLIGHT = require("../../../../assets/engagement_level/slightly-smiling-face.png");
const ENGAGE_LIKE = require("../../../../assets/engagement_level/like.png");
const ENGAGE_COOL = require("../../../../assets/engagement_level/smiling-face-with-sunglasses.png");

// ── Performance star values (1 = worst, 5 = best) ───────────
const PERF_VALUES = ["very_poor", "poor", "fair", "good", "excellent"] as const;
type PerfValue = (typeof PERF_VALUES)[number];

// ── Chip option sets ─────────────────────────────────────────
const ATTENDANCE_CHIPS = [
  { value: "absent", label: "Vắng", icon: "close-circle-outline" },
  { value: "present", label: "Có mặt", icon: "check-circle-outline" },
] as const;

const MOOD_OPTIONS = [
  { value: "very_difficult", label: "Khó chịu" },
  { value: "difficult", label: "Buồn" },
  { value: "neutral", label: "Bình thường" },
  { value: "very_good", label: "Tốt" },
  { value: "good", label: "Rất tốt" },
] as const;

const ENERGY_CHIPS = [
  { value: "low", label: "Thấp", icon: "battery-outline" },
  { value: "normal", label: "Bình thường", icon: "battery-medium" },
  { value: "high", label: "Cao", icon: "lightning-bolt" },
] as const;

const ENGAGEMENT_CHIPS = [
  { value: "disengaged", label: "Mất tập trung", img: ENGAGE_BORED },
  { value: "somewhat_engaged", label: "Khá tập trung", img: ENGAGE_SLIGHT },
  { value: "engaged", label: "Tập trung", img: ENGAGE_LIKE },
  { value: "highly_engaged", label: "Rất tập trung", img: ENGAGE_COOL },
] as const;

// ── Form schema ──────────────────────────────────────────────
const reportSchema = z.object({
  activity_summary: z.string().min(1, "Vui lòng nhập tóm tắt hoạt động"),
  achievements: z.string().optional(),
  challenges_noted: z.string().optional(),
  highlight_moment: z.string().optional(),
  parent_action_guide: z.string().optional(),
  next_session_preview: z.string().optional(),
  teacher_note: z.string().optional(),
});
type ReportFormData = z.infer<typeof reportSchema>;

interface SessionInfo {
  sessionId: number;
  studentId: number;
  studentName: string;
  reportDate: string;
  durationMinutes: number;
  performance: string | null;
  objectives: { name: string; accuracy: number }[];
  avgAccuracy: number;
}

// ── Field config ─────────────────────────────────────────────
const REQUIRED_FIELD = REPORT_FIELDS.find((f) => f.required)!;
const OPTIONAL_FIELDS = REPORT_FIELDS.filter((f) => !f.required && !f.internal);

// ── Main screen ──────────────────────────────────────────────
export function ReportCreateScreen({ navigation, route }: Props) {
  const theme = useTheme();
  const { sessionId: routeSessionId, reportId } = route.params ?? {};
  const isEdit = !!reportId;

  const canPickSession = navigation
    .getState()
    .routeNames.includes("SessionPicker");

  const persistReportMutation = usePersistReport();
  const persistAndSendMutation = usePersistAndSendReport();
  const { data: existingReport } = useReportDetail(reportId ?? 0);

  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [photoAssets, setPhotoAssets] = useState<PhotoAsset[]>([]);
  const [showOptional, setShowOptional] = useState(false);
  const [obs, setObs] = useState({
    attendance: "present",
    mood: "good",
    energy_level: "normal",
    engagement_level: "engaged",
    overall_performance: "good",
    observation_notes: "",
  });
  const [successModal, setSuccessModal] = useState<{
    visible: boolean;
    type: "draft" | "sent";
    reportId: number | null;
  }>({ visible: false, type: "draft", reportId: null });
  const loadedSessionIdRef = useRef<number | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      activity_summary: "",
      achievements: "",
      challenges_noted: "",
      highlight_moment: "",
      parent_action_guide: "",
      next_session_preview: "",
      teacher_note: "",
    },
  });

  useEffect(() => {
    if (existingReport) {
      reset({
        activity_summary: existingReport.activity_summary || "",
        achievements: existingReport.achievements || "",
        challenges_noted: existingReport.challenges_noted || "",
        highlight_moment: existingReport.highlight_moment || "",
        parent_action_guide: existingReport.parent_action_guide || "",
        next_session_preview: existingReport.next_session_preview || "",
        teacher_note: (existingReport as any).teacher_note || "",
      });
      setObs({
        attendance: (existingReport as any).attendance || "present",
        mood: (existingReport as any).mood || "good",
        energy_level: (existingReport as any).energy_level || "normal",
        engagement_level: (existingReport as any).engagement_level || "engaged",
        overall_performance:
          (existingReport as any).overall_performance || "good",
        observation_notes: (existingReport as any).observation_notes || "",
      });
      const sid = Array.isArray(existingReport.session_log_id)
        ? existingReport.session_log_id[0]
        : 0;
      if (sid && loadedSessionIdRef.current !== sid) {
        loadedSessionIdRef.current = sid;
        loadSessionInfo(sid, false);
      }
    }
  }, [existingReport]);

  useEffect(() => {
    if (routeSessionId && !isEdit) {
      if (loadedSessionIdRef.current !== routeSessionId) {
        loadedSessionIdRef.current = routeSessionId;
        loadSessionInfo(routeSessionId, true);
      }
    }
  }, [routeSessionId]);

  useFocusEffect(
    React.useCallback(() => {
      if (
        routeSessionId &&
        !isEdit &&
        loadedSessionIdRef.current !== routeSessionId
      ) {
        loadedSessionIdRef.current = routeSessionId;
        loadSessionInfo(routeSessionId, true);
      }
    }, [routeSessionId, isEdit]),
  );

  async function loadSessionInfo(sessionId: number, applyPrefill = false) {
    setLoading(true);
    try {
      const [session, results] = await Promise.all([
        fetchSessionDetail(sessionId),
        fetchSessionResults(sessionId),
      ]);
      const studentName = Array.isArray(session.student_id)
        ? session.student_id[1]
        : "";
      const durationMinutes = Math.round((session.duration || 0) * 60);
      const perf = session.overall_performance
        ? PERFORMANCE_LABELS[session.overall_performance] || null
        : null;
      const objectives = results
        .filter((r: any) => r.is_recorded)
        .map((r: any) => ({
          name: Array.isArray(r.objective_id)
            ? r.objective_id[1]
            : `OBJ-${r.objective_id}`,
          accuracy: r.score_pct || 0,
          baseline: r.baseline_accuracy_pct ?? null,
          target: r.target_accuracy_pct ?? null,
        }));
      const avg =
        objectives.length > 0
          ? Math.round(
              objectives.reduce((s: number, o: any) => s + o.accuracy, 0) /
                objectives.length,
            )
          : 0;
      const dateStr = formatDate(session.session_date);
      setSessionInfo({
        sessionId,
        studentId: Array.isArray(session.student_id)
          ? session.student_id[0]
          : 0,
        studentName,
        reportDate: dateStr,
        durationMinutes,
        performance: perf,
        objectives,
        avgAccuracy: avg,
      });

      if (applyPrefill) {
        const objSummary =
          objectives.length > 0
            ? ` Thực hành ${objectives.length} mục tiêu với độ chính xác ${avg}%.`
            : "";
        const summary = `Buổi học ${durationMinutes} phút.${objSummary}`;

        const achieved = objectives.filter(
          (o: any) => o.target !== null && o.accuracy >= o.target,
        );
        const achievementsText =
          achieved.length > 0
            ? achieved
                .map(
                  (o: any) =>
                    `• ${o.name}: đạt ${Math.round(o.accuracy)}% (mục tiêu ${Math.round(o.target)}%)`,
                )
                .join("\n")
            : "";

        const struggling = objectives.filter(
          (o: any) => o.baseline !== null && o.accuracy <= o.baseline,
        );
        const challengesText =
          struggling.length > 0
            ? struggling
                .map(
                  (o: any) =>
                    `• ${o.name}: ${Math.round(o.accuracy)}% (mức ban đầu ${Math.round(o.baseline)}%)`,
                )
                .join("\n")
            : "";

        reset((prev) => ({
          ...prev,
          activity_summary: summary,
          achievements: achievementsText,
          challenges_noted: challengesText,
        }));
      }
    } catch {
      toast.error("Không thể tải thông tin buổi học");
    } finally {
      setLoading(false);
    }
  }

  async function pickPhotos() {
    const remaining = 5 - photoAssets.length;
    if (remaining <= 0) {
      toast.info("Đã đạt giới hạn 5 ảnh");
      return;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      toast.info("Cần cấp quyền thư viện ảnh trong cài đặt");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled) {
      const newAssets = result.assets.map((a) => ({
        uri: a.uri,
        base64: a.base64 ?? "",
      }));
      setPhotoAssets((prev) => [...prev, ...newAssets].slice(0, 5));
    }
  }

  function buildPayload(data: ReportFormData) {
    if (!sessionInfo) return null;
    return {
      session_log_id: sessionInfo.sessionId,
      student_id: sessionInfo.studentId,
      report_date: sessionInfo.reportDate.split("/").reverse().join("-"),
      attendance: obs.attendance,
      mood: obs.mood,
      energy_level: obs.energy_level,
      engagement_level: obs.engagement_level,
      overall_performance: obs.overall_performance,
      observation_notes: obs.observation_notes,
      ...data,
    };
  }

  const onSaveDraft = handleSubmit(async (data) => {
    const payload = buildPayload(data);
    if (!payload) return;
    try {
      const rptId = await persistReportMutation.mutateAsync({
        reportId: isEdit ? reportId : null,
        payload,
        photoAssets,
      });
      setSuccessModal({ visible: true, type: "draft", reportId: rptId });
    } catch {
      toast.error("Không thể lưu báo cáo");
    }
  });

  const onSend = handleSubmit(async (data) => {
    const payload = buildPayload(data);
    if (!payload) return;
    Alert.alert(
      "Xác nhận gửi",
      "Báo cáo sẽ được gửi đến phụ huynh qua email. Bạn có chắc?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Gửi",
          onPress: async () => {
            try {
              const rptId = await persistAndSendMutation.mutateAsync({
                reportId: isEdit ? reportId : null,
                payload,
                photoAssets,
              });
              await Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success,
              );
              setSuccessModal({ visible: true, type: "sent", reportId: rptId });
            } catch (e: any) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              toast.error("Không thể gửi báo cáo", e?.message);
            }
          },
        },
      ],
    );
  });

  if (loading) return <LoadingOverlay visible />;

  const selectedPerfIdx = PERF_VALUES.indexOf(
    obs.overall_performance as PerfValue,
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Buổi học ─────────────────────────────────────── */}
        {!sessionInfo ? (
          <Surface
            style={[styles.pickCard, { borderColor: theme.colors.primary }]}
            elevation={0}
          >
            <MaterialCommunityIcons
              name="clipboard-search-outline"
              size={32}
              color={theme.colors.primary}
            />
            <Text
              variant="bodyMedium"
              style={{ marginTop: 8, color: theme.colors.onSurfaceVariant }}
            >
              Chưa chọn buổi học
            </Text>
            {canPickSession && (
              <Button
                mode="contained"
                onPress={() => (navigation as any).navigate("SessionPicker")}
                style={{ marginTop: 12 }}
                icon="magnify"
              >
                Chọn buổi học
              </Button>
            )}
          </Surface>
        ) : (
          <View>
            <SessionInfoCard
              studentName={sessionInfo.studentName}
              reportDate={sessionInfo.reportDate}
              durationMinutes={sessionInfo.durationMinutes}
              performance={sessionInfo.performance}
              objectives={sessionInfo.objectives}
              avgAccuracy={sessionInfo.avgAccuracy}
            />
            {!isEdit && canPickSession && (
              <Button
                mode="text"
                compact
                icon="pencil"
                onPress={() => (navigation as any).navigate("SessionPicker")}
                style={{ alignSelf: "flex-start", marginTop: -4 }}
              >
                Đổi buổi học
              </Button>
            )}
          </View>
        )}

        {/* ── Quan sát chung ────────────────────────────────── */}
        <SectionHeader
          icon="eye-outline"
          title="Quan sát chung"
          theme={theme}
        />
        <Surface
          style={[styles.obsCard, { backgroundColor: theme.colors.surface }]}
          elevation={1}
        >
          {/* Điểm danh */}
          <ObsRow icon="account-check-outline" label="Điểm danh" theme={theme}>
            <View style={styles.chipRow}>
              {ATTENDANCE_CHIPS.map((opt) => {
                const sel = obs.attendance === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    onPress={() =>
                      setObs((p) => ({ ...p, attendance: opt.value }))
                    }
                    style={[
                      styles.chip,
                      sel
                        ? { backgroundColor: theme.colors.primary }
                        : {
                            backgroundColor: "transparent",
                            borderColor: theme.colors.outline,
                          },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={opt.icon as any}
                      size={13}
                      color={sel ? "#fff" : theme.colors.onSurface}
                    />
                    <Text
                      variant="labelSmall"
                      style={{
                        color: sel ? "#fff" : theme.colors.onSurface,
                        marginLeft: 4,
                      }}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ObsRow>

          <Divider style={styles.obsDivider} />

          {/* Tâm trạng */}
          <ObsRow icon="emoticon-outline" label="Tâm trạng" theme={theme}>
            <View style={styles.moodRow}>
              {MOOD_OPTIONS.map((opt) => {
                const sel = obs.mood === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    onPress={() => setObs((p) => ({ ...p, mood: opt.value }))}
                    style={[
                      styles.moodChip,
                      sel
                        ? {
                            borderColor: theme.colors.primary,
                            borderWidth: 2,
                            backgroundColor: theme.colors.primaryContainer,
                          }
                        : {
                            borderColor: theme.colors.outlineVariant,
                            borderWidth: 1,
                          },
                    ]}
                  >
                    <Image
                      source={EMOJI_MAP[opt.value]}
                      style={styles.moodEmoji}
                      resizeMode="contain"
                    />
                    <Text
                      variant="labelSmall"
                      style={{
                        color: sel
                          ? theme.colors.primary
                          : theme.colors.onSurface,
                        marginTop: 3,
                        textAlign: "center",
                        fontSize: 10,
                      }}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ObsRow>

          <Divider style={styles.obsDivider} />

          {/* Mức năng lượng */}
          <ObsRow
            icon="lightning-bolt-outline"
            label="Mức năng lượng"
            theme={theme}
          >
            <View style={styles.chipRow}>
              {ENERGY_CHIPS.map((opt) => {
                const sel = obs.energy_level === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    onPress={() =>
                      setObs((p) => ({ ...p, energy_level: opt.value }))
                    }
                    style={[
                      styles.chip,
                      sel
                        ? { backgroundColor: theme.colors.primary }
                        : {
                            backgroundColor: "transparent",
                            borderColor: theme.colors.outline,
                          },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={opt.icon as any}
                      size={13}
                      color={sel ? "#fff" : theme.colors.onSurface}
                    />
                    <Text
                      variant="labelSmall"
                      style={{
                        color: sel ? "#fff" : theme.colors.onSurface,
                        marginLeft: 4,
                      }}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ObsRow>

          <Divider style={styles.obsDivider} />

          {/* Mức tập trung */}
          <ObsRow icon="target" label="Mức tập trung" theme={theme}>
            <View style={styles.moodRow}>
              {ENGAGEMENT_CHIPS.map((opt) => {
                const sel = obs.engagement_level === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    onPress={() =>
                      setObs((p) => ({ ...p, engagement_level: opt.value }))
                    }
                    style={[
                      styles.engagementChip,
                      sel
                        ? {
                            borderColor: theme.colors.primary,
                            borderWidth: 2,
                            backgroundColor: theme.colors.primaryContainer,
                          }
                        : {
                            borderColor: theme.colors.outlineVariant,
                            borderWidth: 1,
                          },
                    ]}
                  >
                    <Image
                      source={opt.img}
                      style={[styles.engagementImg, !sel && { opacity: 0.65 }]}
                      resizeMode="contain"
                    />
                    <Text
                      variant="labelSmall"
                      numberOfLines={2}
                      style={{
                        color: sel
                          ? theme.colors.primary
                          : theme.colors.onSurface,
                        marginTop: 3,
                        textAlign: "center",
                        fontSize: 10,
                      }}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ObsRow>

          <Divider style={styles.obsDivider} />

          {/* Kết quả tổng thể — 5 sao */}
          <ObsRow icon="star-outline" label="Kết quả tổng thể" theme={theme}>
            <View style={styles.starRow}>
              {PERF_VALUES.map((pv, i) => (
                <TouchableOpacity
                  key={pv}
                  onPress={() =>
                    setObs((p) => ({ ...p, overall_performance: pv }))
                  }
                  activeOpacity={0.7}
                >
                  <Image
                    source={i <= selectedPerfIdx ? STAR_YELLOW : STAR_BLACK}
                    style={styles.starImg}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              ))}
            </View>
          </ObsRow>

          <Divider style={styles.obsDivider} />

          {/* Ghi chú quan sát */}
          <View style={styles.obsNotesWrapper}>
            <View style={styles.obsLabelRow}>
              <MaterialCommunityIcons
                name="pencil-outline"
                size={14}
                color={theme.colors.onSurfaceVariant}
              />
              <Text
                variant="labelSmall"
                style={[
                  styles.obsLabel,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                Ghi chú quan sát
              </Text>
            </View>
            <TextInput
              value={obs.observation_notes}
              onChangeText={(v) =>
                setObs((p) => ({ ...p, observation_notes: v }))
              }
              placeholder="Thêm ghi chú ngắn nếu cần..."
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.obsNotesInput}
              outlineStyle={{ borderRadius: 10 }}
            />
          </View>
        </Surface>

        {/* ── Ảnh buổi học ─────────────────────────────────── */}
        <View style={styles.photoSectionHeader}>
          <SectionHeader
            icon="image-multiple-outline"
            title="Ảnh buổi học"
            theme={theme}
          />
          <Text
            variant="labelSmall"
            style={[
              styles.photoCount,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            {photoAssets.length}/5
          </Text>
        </View>
        <View style={styles.photoRow}>
          {photoAssets.map((asset, index) => (
            <View key={`${asset.uri}-${index}`} style={styles.photoThumb}>
              <Image source={{ uri: asset.uri }} style={styles.photoImg} />
              <TouchableOpacity
                style={styles.photoRemove}
                onPress={() =>
                  setPhotoAssets((p) => p.filter((_, i) => i !== index))
                }
              >
                <MaterialCommunityIcons
                  name="close-circle"
                  size={18}
                  color="#fff"
                />
              </TouchableOpacity>
            </View>
          ))}
          {photoAssets.length < 5 && (
            <TouchableOpacity
              onPress={pickPhotos}
              style={[
                styles.addPhotoBtn,
                { borderColor: theme.colors.outline },
              ]}
            >
              <MaterialCommunityIcons
                name="plus"
                size={24}
                color={theme.colors.onSurfaceVariant}
              />
              <Text
                variant="labelSmall"
                style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}
              >
                Thêm
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Toggle hiện trường tuỳ chọn */}
        <TouchableOpacity
          style={[
            styles.optionalToggle,
            {
              borderColor: showOptional
                ? theme.colors.primary
                : theme.colors.outlineVariant,
              backgroundColor: showOptional
                ? theme.colors.primaryContainer
                : "transparent",
            },
          ]}
          onPress={() => setShowOptional((v) => !v)}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name={
              showOptional
                ? "checkbox-marked-outline"
                : "checkbox-blank-outline"
            }
            size={20}
            color={
              showOptional
                ? theme.colors.primary
                : theme.colors.onSurfaceVariant
            }
          />
          <Text
            variant="bodyMedium"
            style={{
              marginLeft: 8,
              color: showOptional
                ? theme.colors.primary
                : theme.colors.onSurfaceVariant,
            }}
          >
            Thêm thông tin tuỳ chọn
          </Text>
        </TouchableOpacity>

        {/* Các trường tuỳ chọn */}
        {showOptional &&
          OPTIONAL_FIELDS.map((field) => (
            <ExpandableField
              key={field.name}
              field={field}
              control={control}
              error={errors[field.name as keyof typeof errors]?.message}
              theme={theme}
            />
          ))}

        {/* ── Buttons ──────────────────────────────────────── */}
        <Divider style={{ marginTop: 20, marginBottom: 16 }} />
        <View style={styles.actions}>
          <Button
            mode="outlined"
            onPress={onSaveDraft}
            loading={persistReportMutation.isPending}
            icon="content-save-outline"
            style={styles.actionBtn}
            disabled={!sessionInfo || persistAndSendMutation.isPending}
          >
            Lưu nháp
          </Button>
          <Button
            mode="contained"
            onPress={onSend}
            loading={persistAndSendMutation.isPending}
            disabled={!sessionInfo || persistReportMutation.isPending}
            icon="send"
            style={styles.actionBtn}
          >
            Gửi phụ huynh
          </Button>
        </View>
      </ScrollView>

      <Portal>
        <Modal
          visible={successModal.visible}
          onDismiss={() => {}}
          contentContainerStyle={[
            styles.modal,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <View style={styles.modalContent}>
            <MaterialCommunityIcons
              name={
                successModal.type === "sent" ? "send-check" : "check-circle"
              }
              size={56}
              color={theme.colors.primary}
            />
            <Text
              variant="titleMedium"
              style={{ fontWeight: "700", marginTop: 16, textAlign: "center" }}
            >
              {successModal.type === "sent"
                ? "Đã gửi báo cáo!"
                : "Đã lưu báo cáo nháp!"}
            </Text>
            <Text
              variant="bodySmall"
              style={{
                color: theme.colors.onSurfaceVariant,
                marginTop: 8,
                textAlign: "center",
              }}
            >
              {successModal.type === "sent"
                ? "Báo cáo đã được gửi đến phụ huynh qua email."
                : "Báo cáo đã được lưu, bạn có thể chỉnh sửa thêm sau."}
            </Text>
            <Button
              mode="contained"
              style={{ marginTop: 24, minWidth: 120 }}
              onPress={() => {
                setSuccessModal((s) => ({ ...s, visible: false }));
                navigation.goBack();
              }}
            >
              Đóng
            </Button>
          </View>
        </Modal>
      </Portal>
    </View>
  );
}

// ── SectionHeader ─────────────────────────────────────────────
function SectionHeader({
  icon,
  title,
  theme,
}: {
  icon: string;
  title: string;
  theme: any;
}) {
  return (
    <View style={styles.sectionHeader}>
      <MaterialCommunityIcons
        name={icon as any}
        size={17}
        color={theme.colors.primary}
      />
      <Text
        variant="titleSmall"
        style={[styles.sectionTitle, { color: theme.colors.primary }]}
      >
        {title}
      </Text>
    </View>
  );
}

// ── ObsRow — label + content slot ────────────────────────────
function ObsRow({
  icon,
  label,
  theme,
  children,
}: {
  icon: string;
  label: string;
  theme: any;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.obsRowContainer}>
      <View style={styles.obsLabelRow}>
        <MaterialCommunityIcons
          name={icon as any}
          size={14}
          color={theme.colors.onSurfaceVariant}
        />
        <Text
          variant="labelSmall"
          style={[styles.obsLabel, { color: theme.colors.onSurfaceVariant }]}
        >
          {label}
        </Text>
      </View>
      {children}
    </View>
  );
}

// ── ExpandableField — collapsible optional text input ─────────
function ExpandableField({
  field,
  control,
  error,
  theme,
}: {
  field: (typeof REPORT_FIELDS)[0];
  control: any;
  error?: string;
  theme: any;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View
      style={[
        styles.expandableWrapper,
        { borderColor: theme.colors.outlineVariant },
      ]}
    >
      <TouchableOpacity
        style={styles.expandableHeader}
        onPress={() => setExpanded((v) => !v)}
        activeOpacity={0.7}
      >
        <View style={styles.expandableLeft}>
          <View
            style={[
              styles.expandableIconBg,
              { backgroundColor: field.color + "22" },
            ]}
          >
            <MaterialCommunityIcons
              name={field.icon as any}
              size={15}
              color={field.color}
            />
          </View>
          <Text
            variant="bodyMedium"
            style={{ color: theme.colors.onSurface, flex: 1 }}
            numberOfLines={1}
          >
            {field.label}
          </Text>
        </View>
        <View style={styles.expandableRight}>
          <View
            style={[
              styles.optBadge,
              { backgroundColor: theme.colors.surfaceVariant },
            ]}
          >
            <Text
              variant="labelSmall"
              style={{ color: theme.colors.onSurfaceVariant, fontSize: 10 }}
            >
              Tuỳ chọn
            </Text>
          </View>
          <MaterialCommunityIcons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={20}
            color={theme.colors.onSurfaceVariant}
          />
        </View>
      </TouchableOpacity>
      {expanded && (
        <View style={{ paddingHorizontal: 12, paddingBottom: 12 }}>
          <Controller
            control={control}
            name={field.name}
            render={({ field: { onChange, value } }) => (
              <TextInput
                value={value}
                onChangeText={onChange}
                placeholder={field.placeholder}
                mode="outlined"
                multiline
                numberOfLines={field.lines}
                style={styles.textInput}
                error={!!error}
                outlineStyle={{ borderRadius: 10 }}
              />
            )}
          />
          {error && (
            <Text
              variant="labelSmall"
              style={{ color: theme.colors.error, marginTop: 2 }}
            >
              {error}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 48 },

  // Section header
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 20,
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1.5,
    borderBottomColor: "rgba(0,0,0,0.07)",
  },
  sectionTitle: { fontWeight: "700" },

  // Session picker card
  pickCard: {
    padding: 24,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1.5,
    borderStyle: "dashed",
    marginBottom: 8,
  },

  // Observation card
  obsCard: {
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 4,
  },
  obsRowContainer: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  obsLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 8,
  },
  obsLabel: { fontWeight: "600" },
  obsDivider: { marginHorizontal: 0 },
  obsNotesWrapper: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  obsNotesInput: {
    backgroundColor: "transparent",
    marginTop: 2,
  },

  // Chips
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1,
  },

  // Mood emoji chips
  moodRow: {
    flexDirection: "row",
    gap: 6,
  },
  moodChip: {
    alignItems: "center",
    justifyContent: "center",
    width: 54,
    paddingVertical: 7,
    paddingHorizontal: 4,
    borderRadius: 10,
  },
  moodEmoji: {
    width: 30,
    height: 30,
  },

  // Star rating
  starRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 2,
  },
  starImg: {
    width: 30,
    height: 30,
  },
  engagementChip: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 7,
    paddingHorizontal: 4,
    borderRadius: 10,
  },
  engagementImg: {
    width: 28,
    height: 28,
  },

  // Photo section
  photoSectionHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  photoCount: {
    marginBottom: 14,
  },
  photoRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  photoThumb: {
    width: 76,
    height: 76,
    borderRadius: 10,
    overflow: "hidden",
    position: "relative",
  },
  photoImg: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  photoRemove: {
    position: "absolute",
    top: 3,
    right: 3,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 9,
    width: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  addPhotoBtn: {
    width: 76,
    height: 76,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  // Activity summary (required)
  summaryWrapper: {
    marginBottom: 12,
  },
  summaryHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  summaryLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  fieldLabel: { fontWeight: "600" },
  autoBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  autoBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
  },
  textInput: { backgroundColor: "transparent" },

  // Optional toggle checkbox row
  optionalToggle: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 10,
  },

  // Expandable optional field
  expandableWrapper: {
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 8,
    overflow: "hidden",
  },
  expandableHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  expandableLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 10,
  },
  expandableIconBg: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  expandableRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  optBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },

  // Actions
  actions: {
    flexDirection: "row",
    gap: 10,
  },
  actionBtn: { flex: 1 },

  // Success modal
  modal: {
    marginHorizontal: 32,
    borderRadius: 20,
    overflow: "hidden",
  },
  modalContent: {
    padding: 32,
    alignItems: "center",
  },
});
