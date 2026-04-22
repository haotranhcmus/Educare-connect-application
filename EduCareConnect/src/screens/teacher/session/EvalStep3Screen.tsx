import React from "react";
import { View, ScrollView, StyleSheet, Alert } from "react-native";
import { Text, Button, Divider, useTheme } from "react-native-paper";
import { StepIndicator } from "../../../components/common/StepIndicator";
import { useEvalStore } from "../../../store/evalStore";
import { useSubmitEval } from "../../../hooks/useEval";
import { useSessionDetail } from "../../../hooks/useSessions";
import { formatDate, formatFloatTime } from "../../../utils/formatters";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { TeacherSessionStackParamList } from "../../../navigation/types";
import { MaterialCommunityIcons } from "@expo/vector-icons";

type Props = NativeStackScreenProps<TeacherSessionStackParamList, "EvalStep3">;

const STEPS = ["Kết quả MT", "Quan sát", "Xác nhận"];

const PROMPT_LABEL: Record<string, string> = {
  independent: "Độc lập",
  verbal_prompt: "Gợi ý ngôn ngữ",
  gestural_prompt: "Gợi ý cử chỉ",
  partial_physical: "Hỗ trợ một phần",
  full_physical: "Hỗ trợ hoàn toàn",
};

const OBS_LABELS: Record<string, Record<string, string>> = {
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
    partially_engaged: "Một phần",
    disengaged: "Không tham gia",
  },
  overall_performance: {
    excellent: "Xuất sắc",
    good: "Tốt",
    fair: "Bình thường",
    poor: "Kém",
  },
};

export function EvalStep3Screen({ route, navigation }: Props) {
  const { sessionId } = route.params;
  const theme = useTheme();
  const { data: session } = useSessionDetail(sessionId);
  const results = useEvalStore((s) => s.results);
  const observation = useEvalStore((s) => s.observation);
  const reset = useEvalStore((s) => s.reset);
  const submitMutation = useSubmitEval();

  const studentName = Array.isArray(session?.student_id)
    ? session.student_id[1]
    : "";
  const resultsArray = Array.from(results.values());
  const avgAccuracy =
    resultsArray.length > 0
      ? Math.round(
          resultsArray.reduce(
            (sum, r) =>
              sum +
              (r.total_trials > 0
                ? (r.correct_trials / r.total_trials) * 100
                : 0),
            0,
          ) / resultsArray.length,
        )
      : 0;

  const handleConfirm = async () => {
    try {
      await submitMutation.mutateAsync({
        sessionId,
        results: resultsArray,
        observation,
      });
      reset();
      // Navigate back to session detail (which should now show done status)
      navigation.popToTop();
      navigation.navigate("SessionDetail", { sessionId });
    } catch (e: any) {
      Alert.alert("Lỗi", e.message || "Không thể hoàn thành đánh giá");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StepIndicator steps={STEPS} currentStep={2} />

      <ScrollView contentContainerStyle={styles.content}>
        <Text
          variant="titleSmall"
          style={{ fontWeight: "700", marginBottom: 4 }}
        >
          Tóm Tắt Buổi Học
        </Text>
        <Text
          variant="bodySmall"
          style={{ color: theme.colors.outline, marginBottom: 16 }}
        >
          {studentName} · {formatDate(session?.session_date || "")} ·{" "}
          {formatFloatTime(session?.start_time || 0)}
        </Text>

        {/* Results summary */}
        <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Text variant="labelMedium" style={{ fontWeight: "700" }}>
            Kết quả · {resultsArray.length} mục tiêu
          </Text>
          <Divider style={{ marginVertical: 8 }} />
          {resultsArray.map((r) => (
            <View key={r.objective_id} style={styles.resultRow}>
              <View style={{ flex: 1 }}>
                <Text variant="bodySmall">
                  OBJ-{String(r.objective_id).padStart(3, "0")}
                </Text>
                <Text
                  variant="labelSmall"
                  style={{ color: theme.colors.onSurfaceVariant }}
                >
                  {r.correct_trials}/{r.total_trials} →{" "}
                  {r.total_trials > 0
                    ? Math.round((r.correct_trials / r.total_trials) * 100)
                    : 0}
                  %
                </Text>
              </View>
              <Text
                variant="labelSmall"
                style={{ color: theme.colors.outline }}
              >
                {PROMPT_LABEL[r.prompt_level_used] || r.prompt_level_used}
              </Text>
            </View>
          ))}
          <Divider style={{ marginVertical: 8 }} />
          <Text
            variant="bodyMedium"
            style={{ fontWeight: "700", color: theme.colors.primary }}
          >
            Trung bình: {avgAccuracy}%
          </Text>
        </View>

        {/* Observation summary */}
        <View
          style={[
            styles.card,
            { backgroundColor: theme.colors.surface, marginTop: 12 },
          ]}
        >
          <Text variant="labelMedium" style={{ fontWeight: "700" }}>
            Quan sát
          </Text>
          <Divider style={{ marginVertical: 8 }} />
          <ObsRow
            label="Tâm trạng"
            value={OBS_LABELS.mood[observation.mood] || observation.mood}
          />
          <ObsRow
            label="Năng lượng"
            value={
              OBS_LABELS.energy_level[observation.energy_level] ||
              observation.energy_level
            }
          />
          <ObsRow
            label="Tập trung"
            value={
              OBS_LABELS.engagement_level[observation.engagement_level] ||
              observation.engagement_level
            }
          />
          <ObsRow
            label="Kết quả tổng"
            value={
              OBS_LABELS.overall_performance[observation.overall_performance] ||
              observation.overall_performance
            }
          />
          {observation.notes ? (
            <Text
              variant="bodySmall"
              style={{ marginTop: 4, color: theme.colors.onSurfaceVariant }}
            >
              Ghi chú: {observation.notes}
            </Text>
          ) : null}
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: theme.colors.surface }]}>
        <Button mode="outlined" onPress={() => navigation.goBack()}>
          ← Quay lại
        </Button>
        {/* Confirm button */}
        <Button
          mode="contained"
          onPress={handleConfirm}
          loading={submitMutation.isPending}
          disabled={submitMutation.isPending}
        >
          <MaterialCommunityIcons name="check-circle" /> Hoàn tất
        </Button>
      </View>
    </View>
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

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 80 },
  card: { padding: 16, borderRadius: 12, elevation: 1 },
  resultRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 4,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    flexDirection: "row",
    justifyContent: "space-between",
  },
});
