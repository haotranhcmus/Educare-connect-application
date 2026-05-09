import React from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { Text, Divider, useTheme } from "react-native-paper";
import { StatusBadge } from "../../../components/common/StatusBadge";
import { LoadingOverlay } from "../../../components/common/LoadingOverlay";
import {
  useSessionDetail,
  useSessionResults,
} from "../../../hooks/useSessions";
import { formatDate, formatFloatTime } from "../../../utils/formatters";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { SessionStackParamList } from "../../../navigation/types";

type Props = NativeStackScreenProps<SessionStackParamList, "EvalDetailView">;

const PROMPT_LABEL: Record<string, string> = {
  independent: "Độc lập",
  verbal_prompt: "Gợi ý ngôn ngữ",
  gestural_prompt: "Gợi ý cử chỉ",
  partial_physical: "Hỗ trợ một phần",
  full_physical: "Hỗ trợ hoàn toàn",
};

const PHASE_LABEL: Record<string, string> = {
  baseline: "Cơ sở ban đầu",
  intervention: "Can thiệp",
  maintenance: "Duy trì",
  generalization: "Tổng quát hóa",
};

const RESULT_TYPE_LABEL: Record<string, string> = {
  trial_by_trial: "Trial-by-Trial",
  probe: "Probe",
  whole_task: "Whole Task",
  partial_interval: "Khoảng thời gian một phần",
  momentary_time_sample: "Khoảng thời điểm",
};

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

export function EvalDetailViewScreen({ route }: Props) {
  const { sessionId } = route.params;
  const theme = useTheme();
  const { data: session, isLoading: sessLoading } = useSessionDetail(sessionId);
  const { data: results = [], isLoading: resLoading } =
    useSessionResults(sessionId);

  if (sessLoading || resLoading) return <LoadingOverlay visible />;
  if (!session) return null;

  const studentName = Array.isArray(session.student_id)
    ? session.student_id[1]
    : "";

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.content}
    >
      {/* Sticky header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <Text variant="bodySmall">
          {studentName} · {formatDate(session.session_date)} ·{" "}
          {formatFloatTime(session.start_time)}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <StatusBadge status={session.status} />
          <Text variant="labelSmall" style={{ color: theme.colors.outline }}>
            Trung bình: {Math.round(session.avg_accuracy || 0)}%
          </Text>
        </View>
      </View>

      {/* Observations */}
      <Text variant="titleSmall" style={styles.sectionTitle}>
        Quan Sát Chung
      </Text>
      <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <ObsRow label="Điểm danh" value={session.attendance || "—"} />
        <ObsRow label="Tâm trạng" value={session.mood || "—"} />
        <ObsRow label="Năng lượng" value={session.energy_level || "—"} />
        <ObsRow label="Tập trung" value={session.engagement_level || "—"} />
        <ObsRow
          label="Kết quả tổng"
          value={session.overall_performance || "—"}
        />
        {session.notes ? (
          <Text
            variant="bodySmall"
            style={{ marginTop: 8, color: theme.colors.onSurfaceVariant }}
          >
            Ghi chú: {session.notes}
          </Text>
        ) : null}
      </View>

      {/* Results */}
      <Text variant="titleSmall" style={styles.sectionTitle}>
        Kết Quả Mục Tiêu ({results.length})
      </Text>
      {results.map((r, idx) => {
        const objName = Array.isArray(r.objective_id) ? r.objective_id[1] : "";
        return (
          <View
            key={r.id}
            style={[
              styles.resultCard,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            <Text variant="labelMedium" style={{ color: theme.colors.primary }}>
              MT {idx + 1} / {results.length} · {objName.split(" ")[0]}
            </Text>
            <Text variant="bodySmall">{objName}</Text>
            <Divider style={{ marginVertical: 8 }} />
            <DetailRow
              label="Loại"
              value={RESULT_TYPE_LABEL[r.result_type] || r.result_type}
            />
            <DetailRow
              label="Số lần đúng / Tổng"
              value={`${r.correct_trials} / ${r.total_trials}`}
            />
            <DetailRow
              label="Độ chính xác"
              value={`${Math.round(r.accuracy_pct)}%`}
            />
            <DetailRow
              label="Mức hỗ trợ"
              value={
                PROMPT_LABEL[r.prompt_level_used] || r.prompt_level_used || "—"
              }
            />
            <DetailRow
              label="Pha"
              value={PHASE_LABEL[r.phase] || r.phase || "—"}
            />
            {r.notes ? <DetailRow label="Ghi chú" value={r.notes} /> : null}
          </View>
        );
      })}
    </ScrollView>
  );
}

function ObsRow({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        marginVertical: 2,
      }}
    >
      <Text variant="labelSmall" style={{ color: theme.colors.outline }}>
        {label}
      </Text>
      <Text variant="bodySmall">{value}</Text>
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: "row", marginVertical: 2 }}>
      <Text
        variant="labelSmall"
        style={{ color: theme.colors.outline, width: 140 }}
      >
        {label}
      </Text>
      <Text variant="bodySmall" style={{ flex: 1 }}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 32 },
  header: { padding: 12, borderRadius: 12, marginBottom: 16, elevation: 1 },
  sectionTitle: { fontWeight: "700", marginVertical: 8 },
  card: { padding: 12, borderRadius: 12, elevation: 1, marginBottom: 8 },
  resultCard: { padding: 16, borderRadius: 12, elevation: 1, marginBottom: 12 },
});
