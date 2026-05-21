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
  IconButton,
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
import {
  fetchSessionDetail,
  fetchSessionResults,
} from "@api/sessionApi";
import { Picker } from "@components/form/Picker";
import {
  PERFORMANCE_LABELS,
  ATTENDANCE_LABELS,
  MOOD_LABELS,
  ENERGY_LABELS,
  ENGAGEMENT_LABELS,
  toPickerOptions,
} from "@utils/labels";
import { REPORT_FIELDS } from "@constants/reportFields";
import { formatDate } from "@utils/formatters";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { ReportStackParamList } from "@navigation/types";
import type { PhotoAsset } from "@t";

type Props = NativeStackScreenProps<ReportStackParamList, "ReportCreate">;

const ATTENDANCE_OPTIONS = toPickerOptions(ATTENDANCE_LABELS);
const MOOD_OPTIONS = toPickerOptions(MOOD_LABELS);
const ENERGY_OPTIONS = toPickerOptions(ENERGY_LABELS);
const ENGAGEMENT_OPTIONS = toPickerOptions(ENGAGEMENT_LABELS);
const PERFORMANCE_OPTIONS = toPickerOptions(PERFORMANCE_LABELS);

// ── Validation Schema ─────────────────────────────────────────
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

export function ReportCreateScreen({ navigation, route }: Props) {
  const theme = useTheme();
  const { sessionId: routeSessionId, reportId } = route.params ?? {};
  const isEdit = !!reportId;

  // Only the ReportStack has SessionPicker; in SessionStack/StudentStack the
  // sessionId is always passed in via route params, so the picker is hidden.
  const canPickSession = navigation
    .getState()
    .routeNames.includes("SessionPicker");

  const persistReportMutation = usePersistReport();
  const persistAndSendMutation = usePersistAndSendReport();
  const { data: existingReport } = useReportDetail(reportId ?? 0);

  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [photoAssets, setPhotoAssets] = useState<PhotoAsset[]>([]);
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
  // Track which sessionId was last loaded to avoid duplicate fetches
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
        teacher_note: existingReport.teacher_note || "",
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

  // Primary effect: load when routeSessionId is set (new report flow)
  useEffect(() => {
    if (routeSessionId && !isEdit) {
      if (loadedSessionIdRef.current !== routeSessionId) {
        loadedSessionIdRef.current = routeSessionId;
        loadSessionInfo(routeSessionId, true);
      }
    }
  }, [routeSessionId]);

  // Fallback: re-check on focus in case navigate() params update didn't trigger above
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
        .filter((r: any) => r.total_trials > 0)
        .map((r: any) => ({
          name: Array.isArray(r.objective_id)
            ? r.objective_id[1]
            : `OBJ-${r.objective_id}`,
          accuracy: r.accuracy_pct || 0,
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
        // ── Auto-generate pre-fill text ─────────────────────────
        const perfNote = perf ? ` Kết quả tổng thể: ${perf}.` : "";
        const objSummary =
          objectives.length > 0
            ? ` Thực hành ${objectives.length} mục tiêu với độ chính xác trung bình ${avg}%.`
            : "";
        const summary = `Buổi học kéo dài ${durationMinutes} phút tại trung tâm.${objSummary}${perfNote}`;

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
              setSuccessModal({
                visible: true,
                type: "sent",
                reportId: rptId,
              });
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

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Chọn buổi học ────────────────────────────── */}
        <SectionHeader icon="calendar-clock" title="Buổi Học" theme={theme} />

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
                onPress={() =>
                  (navigation as any).navigate("SessionPicker")
                }
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

        {/* ── Ảnh/Video ─────────────────────────────────── */}
        <SectionHeader
          icon="image-multiple-outline"
          title="Ảnh buổi học"
          theme={theme}
        />
        <View style={styles.photoSection}>
          {/* Existing photo thumbnails */}
          {photoAssets.length > 0 && (
            <FlatList
              horizontal
              data={photoAssets}
              keyExtractor={(a, i) => `${a.uri}-${i}`}
              renderItem={({ item: asset, index }) => (
                <View style={styles.photoThumb}>
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
              )}
              style={{ marginBottom: 10 }}
              showsHorizontalScrollIndicator={false}
            />
          )}
          {/* Add photo button */}
          {photoAssets.length < 5 && (
            <TouchableOpacity
              onPress={pickPhotos}
              style={[
                styles.addPhotoBtn,
                { borderColor: theme.colors.outline },
              ]}
            >
              <MaterialCommunityIcons
                name="image-plus"
                size={24}
                color={theme.colors.primary}
              />
              <Text
                variant="labelMedium"
                style={{ color: theme.colors.primary, marginTop: 4 }}
              >
                Thêm ảnh ({photoAssets.length}/5)
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Quan Sát Chung ────────────────────────────── */}
        <SectionHeader
          icon="eye-outline"
          title="Quan Sát Chung"
          theme={theme}
        />
        <View style={styles.obsSection}>
          <Picker
            label="Điểm danh"
            value={obs.attendance}
            options={ATTENDANCE_OPTIONS}
            onChange={(v) => setObs((p) => ({ ...p, attendance: v }))}
          />
          <Picker
            label="Tâm trạng"
            value={obs.mood}
            options={MOOD_OPTIONS}
            onChange={(v) => setObs((p) => ({ ...p, mood: v }))}
          />
          <Picker
            label="Mức năng lượng"
            value={obs.energy_level}
            options={ENERGY_OPTIONS}
            onChange={(v) => setObs((p) => ({ ...p, energy_level: v }))}
          />
          <Picker
            label="Mức tập trung"
            value={obs.engagement_level}
            options={ENGAGEMENT_OPTIONS}
            onChange={(v) => setObs((p) => ({ ...p, engagement_level: v }))}
          />
          <Picker
            label="Kết quả tổng thể"
            value={obs.overall_performance}
            options={PERFORMANCE_OPTIONS}
            onChange={(v) => setObs((p) => ({ ...p, overall_performance: v }))}
          />
          <TextInput
            label="Ghi chú quan sát"
            value={obs.observation_notes}
            onChangeText={(v) =>
              setObs((p) => ({ ...p, observation_notes: v }))
            }
            mode="outlined"
            multiline
            numberOfLines={3}
            style={styles.obsNotes}
          />
        </View>

        {/* ── Nội dung báo cáo ─────────────────────────── */}
        <SectionHeader
          icon="file-document-edit-outline"
          title="Nội Dung Báo Cáo"
          theme={theme}
        />

        {REPORT_FIELDS.map((field) => (
          <ReportField
            key={field.name}
            control={control}
            field={field}
            error={errors[field.name]?.message}
            theme={theme}
          />
        ))}

        {/* ── Nút hành động ───────────────────────────── */}
        <Divider style={{ marginTop: 8, marginBottom: 16 }} />
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
                // Always pop ReportCreate off the stack — user returns to
                // whichever screen launched the create flow (SessionDetail
                // most commonly). For sent reports, the underlying screen
                // refetches via the mutation's query invalidation, so the
                // report status is up-to-date when they land back.
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

// ── Section header component ──────────────────────────────────
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
        size={18}
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

// ── Reusable report field ─────────────────────────────────────
function ReportField({
  control,
  field,
  error,
  theme,
}: {
  control: any;
  field: (typeof REPORT_FIELDS)[0];
  error?: string;
  theme: any;
}) {
  return (
    <View style={styles.fieldWrapper}>
      <View style={styles.fieldLabelRow}>
        <MaterialCommunityIcons
          name={field.icon as any}
          size={16}
          color={field.required ? theme.colors.primary : theme.colors.outline}
        />
        <Text
          variant="labelMedium"
          style={[
            styles.fieldLabel,
            {
              color: field.required
                ? theme.colors.onSurface
                : theme.colors.onSurfaceVariant,
            },
          ]}
        >
          {field.label}
          {field.required && (
            <Text style={{ color: theme.colors.error }}> *</Text>
          )}
        </Text>
      </View>
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
      {error ? (
        <Text
          variant="labelSmall"
          style={{ color: theme.colors.error, marginTop: 2 }}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 48 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 20,
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1.5,
    borderBottomColor: "rgba(0,0,0,0.08)",
  },
  sectionTitle: { fontWeight: "700" },
  pickCard: {
    padding: 24,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1.5,
    borderStyle: "dashed",
    marginBottom: 8,
  },
  fieldWrapper: { marginBottom: 16 },
  fieldLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  fieldLabel: { fontWeight: "600" },
  textInput: { backgroundColor: "transparent" },
  actions: {
    flexDirection: "row",
    gap: 10,
  },
  actionBtn: { flex: 1 },
  // Photo section
  photoSection: {
    marginBottom: 8,
  },
  photoThumb: {
    width: 80,
    height: 80,
    borderRadius: 10,
    marginRight: 8,
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
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderRadius: 12,
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  // Observation section
  obsSection: {
    gap: 8,
    marginBottom: 8,
  },
  obsNotes: {
    marginTop: 4,
  },
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
