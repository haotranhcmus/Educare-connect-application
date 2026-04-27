import React, { useEffect, useState, useRef } from "react";
import { View, ScrollView, StyleSheet, Alert } from "react-native";
import {
  TextInput,
  Button,
  Text,
  Divider,
  useTheme,
  Surface,
  IconButton,
} from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFocusEffect } from "@react-navigation/native";
import { CommonActions } from "@react-navigation/native";
import { SessionInfoCard } from "../../../components/report/SessionInfoCard";
import { LoadingOverlay } from "../../../components/common/LoadingOverlay";
import {
  useCreateReport,
  useUpdateReport,
  useSendReport,
  useReportDetail,
} from "../../../hooks/useReports";
import {
  fetchSessionDetail,
  fetchSessionResults,
} from "../../../api/sessionApi";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { ReportStackParamList } from "../../../navigation/types";

type Props = NativeStackScreenProps<ReportStackParamList, "ReportCreate">;

const PERF_LABELS: Record<string, string> = {
  excellent: "Xuất sắc",
  good: "Tốt",
  average: "Trung bình",
  needs_support: "Cần hỗ trợ",
};

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

// Report fields config
const REPORT_FIELDS: {
  name: keyof ReportFormData;
  label: string;
  icon: string;
  placeholder: string;
  lines: number;
  required?: boolean;
}[] = [
  {
    name: "activity_summary",
    label: "Tóm tắt hoạt động",
    icon: "clipboard-text-outline",
    placeholder: "Hôm nay bé đã làm gì trong buổi học?",
    lines: 4,
    required: true,
  },
  {
    name: "achievements",
    label: "Thành tích nổi bật",
    icon: "star-outline",
    placeholder: "Bé đã đạt được gì đáng khen?",
    lines: 3,
  },
  {
    name: "challenges_noted",
    label: "Điểm cần hỗ trợ thêm",
    icon: "lightbulb-outline",
    placeholder: "Những điểm cần tiếp tục luyện tập...",
    lines: 3,
  },
  {
    name: "highlight_moment",
    label: "Khoảnh khắc đáng nhớ",
    icon: "heart-outline",
    placeholder: "Một khoảnh khắc đặc biệt trong buổi học...",
    lines: 2,
  },
  {
    name: "parent_action_guide",
    label: "Hướng dẫn luyện tập tại nhà",
    icon: "home-heart",
    placeholder: "Phụ huynh có thể hỗ trợ bé bằng cách...",
    lines: 3,
  },
  {
    name: "next_session_preview",
    label: "Nội dung buổi học tới",
    icon: "calendar-arrow-right",
    placeholder: "Buổi học tiếp theo chúng ta sẽ...",
    lines: 2,
  },
  {
    name: "teacher_note",
    label: "Ghi chú nội bộ (chỉ giáo viên thấy)",
    icon: "lock-outline",
    placeholder: "Ghi chú dành riêng cho giáo viên...",
    lines: 2,
  },
];

export function ReportCreateScreen({ navigation, route }: Props) {
  const theme = useTheme();
  const { sessionId: routeSessionId, reportId } = route.params ?? {};
  const isEdit = !!reportId;

  const createReport = useCreateReport();
  const updateReport = useUpdateReport();
  const sendReport = useSendReport();
  const { data: existingReport } = useReportDetail(reportId ?? 0);

  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [loading, setLoading] = useState(false);
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
      if (routeSessionId && !isEdit && loadedSessionIdRef.current !== routeSessionId) {
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
        ? PERF_LABELS[session.overall_performance] || null
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
      const d = new Date(session.session_date + "T00:00:00");
      const dateStr = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
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
      Alert.alert("Lỗi", "Không thể tải thông tin buổi học");
    } finally {
      setLoading(false);
    }
  }

  function buildPayload(data: ReportFormData) {
    if (!sessionInfo) return null;
    return {
      session_log_id: sessionInfo.sessionId,
      student_id: sessionInfo.studentId,
      report_date: sessionInfo.reportDate.split("/").reverse().join("-"),
      ...data,
    };
  }

  const onSaveDraft = handleSubmit(async (data) => {
    const payload = buildPayload(data);
    if (!payload) return;
    try {
      if (isEdit && reportId) {
        await updateReport.mutateAsync({ reportId, vals: payload });
      } else {
        await createReport.mutateAsync(payload);
      }
      navigation.goBack();
    } catch {
      Alert.alert("Lỗi", "Không thể lưu báo cáo");
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
              let rptId = reportId;
              if (isEdit && reportId) {
                await updateReport.mutateAsync({ reportId, vals: payload });
              } else {
                rptId = await createReport.mutateAsync(payload);
              }
              if (rptId) {
                await sendReport.mutateAsync(rptId);
                // Reset stack so back from ReportDetail goes to ReportList (not SessionPicker)
                navigation.dispatch(
                  CommonActions.reset({
                    index: 1,
                    routes: [
                      { name: "ReportList" },
                      { name: "ReportDetail", params: { reportId: rptId } },
                    ],
                  }),
                );
              }
            } catch (e: any) {
              Alert.alert("Lỗi", e?.message || "Không thể gửi báo cáo");
            }
          },
        },
      ],
    );
  });

  if (loading) return <LoadingOverlay visible />;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
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
          <Button
            mode="contained"
            onPress={() => navigation.navigate("SessionPicker")}
            style={{ marginTop: 12 }}
            icon="magnify"
          >
            Chọn buổi học
          </Button>
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
          {!isEdit && (
            <Button
              mode="text"
              compact
              icon="pencil"
              onPress={() => navigation.navigate("SessionPicker")}
              style={{ alignSelf: "flex-start", marginTop: -4 }}
            >
              Đổi buổi học
            </Button>
          )}
        </View>
      )}

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
          loading={createReport.isPending || updateReport.isPending}
          icon="content-save-outline"
          style={styles.actionBtn}
          disabled={!sessionInfo}
        >
          Lưu nháp
        </Button>
        <Button
          mode="contained"
          onPress={onSend}
          loading={sendReport.isPending}
          disabled={
            !sessionInfo || createReport.isPending || updateReport.isPending
          }
          icon="send"
          style={styles.actionBtn}
        >
          Gửi phụ huynh
        </Button>
      </View>
    </ScrollView>
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
});
