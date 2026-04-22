import React, { useEffect, useState } from "react";
import { View, ScrollView, StyleSheet, Alert } from "react-native";
import { TextInput, Button, Text, Divider, useTheme } from "react-native-paper";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { SessionInfoCard } from "../../../components/report/SessionInfoCard";
import { LoadingOverlay } from "../../../components/common/LoadingOverlay";
import {
  useCreateReport,
  useUpdateReport,
  useSendReport,
  useReportDetail,
  useSessionsForReport,
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

// ── Session info state ────────────────────────────────────────
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

  // ── Hooks ────────────────────────────────────────────────────
  const createReport = useCreateReport();
  const updateReport = useUpdateReport();
  const sendReport = useSendReport();
  const { data: existingReport } = useReportDetail(reportId ?? 0);

  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [loading, setLoading] = useState(false);

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

  // ── Load existing report for edit mode ──────────────────────
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
      // Load session info from existing report
      loadSessionInfo(
        Array.isArray(existingReport.session_log_id)
          ? existingReport.session_log_id[0]
          : 0,
      );
    }
  }, [existingReport]);

  // ── Load session info when sessionId provided ───────────────
  useEffect(() => {
    if (routeSessionId && !isEdit) {
      loadSessionInfo(routeSessionId);
    }
  }, [routeSessionId]);

  async function loadSessionInfo(sessionId: number) {
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
    } catch {
      Alert.alert("Lỗi", "Không thể tải thông tin buổi học");
    } finally {
      setLoading(false);
    }
  }

  // ── Submit handlers ─────────────────────────────────────────
  const onSaveDraft = handleSubmit(async (data) => {
    if (!sessionInfo) return;
    const payload = {
      session_log_id: sessionInfo.sessionId,
      student_id: sessionInfo.studentId,
      report_date: sessionInfo.reportDate.split("/").reverse().join("-"),
      ...data,
    };
    try {
      if (isEdit && reportId) {
        await updateReport.mutateAsync({ reportId: reportId!, vals: payload });
      } else {
        await createReport.mutateAsync(payload);
      }
      navigation.goBack();
    } catch {
      Alert.alert("Lỗi", "Không thể lưu báo cáo");
    }
  });

  const onSend = handleSubmit(async (data) => {
    if (!sessionInfo) return;
    Alert.alert(
      "Xác nhận gửi",
      "Báo cáo sẽ được gửi đến phụ huynh qua email. Bạn có chắc?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Gửi",
          onPress: async () => {
            const payload = {
              session_log_id: sessionInfo.sessionId,
              student_id: sessionInfo.studentId,
              report_date: sessionInfo.reportDate
                .split("/")
                .reverse()
                .join("-"),
              ...data,
            };
            try {
              let rptId = reportId;
              if (isEdit && reportId) {
                await updateReport.mutateAsync({
                  reportId: reportId!,
                  vals: payload,
                });
              } else {
                const created = await createReport.mutateAsync(payload);
                rptId = created;
              }
              if (rptId) {
                await sendReport.mutateAsync(rptId);
              }
              navigation.goBack();
            } catch {
              Alert.alert("Lỗi", "Không thể gửi báo cáo");
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
      {/* Section: Chọn buổi học */}
      <Text variant="titleSmall" style={styles.sectionTitle}>
        ━━━ Chọn Buổi Học ━━━
      </Text>

      {!sessionInfo ? (
        <Button
          mode="outlined"
          icon="clipboard-text"
          onPress={() => navigation.navigate("SessionPicker")}
          style={{ marginBottom: 16 }}
        >
          Chọn buổi học...
        </Button>
      ) : (
        <SessionInfoCard
          studentName={sessionInfo.studentName}
          reportDate={sessionInfo.reportDate}
          durationMinutes={sessionInfo.durationMinutes}
          performance={sessionInfo.performance}
          objectives={sessionInfo.objectives}
          avgAccuracy={sessionInfo.avgAccuracy}
        />
      )}

      {/* Section: Nội dung báo cáo */}
      <Text variant="titleSmall" style={styles.sectionTitle}>
        ━━━ Nội Dung Báo Cáo ━━━
      </Text>

      <ReportTextArea
        control={control}
        name="activity_summary"
        label="Tóm tắt hoạt động *"
        error={errors.activity_summary?.message}
        numberOfLines={4}
      />
      <ReportTextArea
        control={control}
        name="achievements"
        label="Thành tích nổi bật"
      />
      <ReportTextArea
        control={control}
        name="challenges_noted"
        label="Điểm cần tiếp tục hỗ trợ"
      />
      <ReportTextArea
        control={control}
        name="highlight_moment"
        label="Khoảnh khắc đáng nhớ 🌟"
      />
      <ReportTextArea
        control={control}
        name="parent_action_guide"
        label="Hướng dẫn cho phụ huynh tại nhà"
      />
      <ReportTextArea
        control={control}
        name="next_session_preview"
        label="Xem trước buổi học tới"
      />
      <ReportTextArea
        control={control}
        name="teacher_note"
        label="Ghi chú nội bộ (chỉ GV thấy)"
      />

      <Divider style={{ marginVertical: 16 }} />

      {/* Action buttons */}
      <View style={styles.actions}>
        <Button
          mode="outlined"
          onPress={onSaveDraft}
          loading={createReport.isPending || updateReport.isPending}
          style={{ flex: 1, marginRight: 8 }}
        >
          Lưu nháp
        </Button>
        <Button
          mode="contained"
          onPress={onSend}
          loading={sendReport.isPending}
          disabled={!sessionInfo}
          style={{ flex: 1 }}
        >
          Gửi →
        </Button>
      </View>
    </ScrollView>
  );
}

// ── Reusable TextArea ─────────────────────────────────────────
function ReportTextArea({
  control,
  name,
  label,
  error,
  numberOfLines = 3,
}: {
  control: any;
  name: string;
  label: string;
  error?: string;
  numberOfLines?: number;
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value } }) => (
        <TextInput
          label={label}
          value={value}
          onChangeText={onChange}
          mode="outlined"
          multiline
          numberOfLines={numberOfLines}
          style={{ marginBottom: 12 }}
          error={!!error}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  sectionTitle: { marginBottom: 12, fontWeight: "700" },
  actions: { flexDirection: "row", marginTop: 8 },
});
