import React from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { Text, TextInput, Button, useTheme } from "react-native-paper";
import { StepIndicator } from "../../../components/common/StepIndicator";
import { Picker } from "../../../components/form/Picker";
import { useEvalStore } from "../../../store/evalStore";
import { useSessionDetail } from "../../../hooks/useSessions";
import { formatDate, formatFloatTime } from "../../../utils/formatters";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { TeacherSessionStackParamList } from "../../../navigation/types";

type Props = NativeStackScreenProps<TeacherSessionStackParamList, "EvalStep2">;

const STEPS = ["Kết quả MT", "Quan sát", "Xác nhận"];

const ATTENDANCE_OPTIONS = [
  { value: "present", label: "Có mặt" },
  { value: "absent", label: "Vắng" },
  { value: "late", label: "Đến muộn" },
];

const MOOD_OPTIONS = [
  { value: "very_good", label: "Rất tốt" },
  { value: "good", label: "Tốt" },
  { value: "neutral", label: "Bình thường" },
  { value: "difficult", label: "Khó khăn" },
  { value: "very_difficult", label: "Rất khó khăn" },
];

const ENERGY_OPTIONS = [
  { value: "high", label: "Cao" },
  { value: "normal", label: "Bình thường" },
  { value: "low", label: "Thấp" },
];

const ENGAGEMENT_OPTIONS = [
  { value: "highly_engaged", label: "Rất tập trung" },
  { value: "engaged", label: "Có tham gia" },
  { value: "partially_engaged", label: "Tham gia một phần" },
  { value: "disengaged", label: "Không tham gia" },
];

const PERFORMANCE_OPTIONS = [
  { value: "excellent", label: "Xuất sắc" },
  { value: "good", label: "Tốt" },
  { value: "fair", label: "Bình thường" },
  { value: "poor", label: "Kém" },
];

export function EvalStep2Screen({ route, navigation }: Props) {
  const { sessionId } = route.params;
  const theme = useTheme();
  const { data: session } = useSessionDetail(sessionId);
  const observation = useEvalStore((s) => s.observation);
  const setObservation = useEvalStore((s) => s.setObservation);

  const studentName = Array.isArray(session?.student_id)
    ? session.student_id[1]
    : "";

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StepIndicator steps={STEPS} currentStep={1} />

      <ScrollView contentContainerStyle={styles.content}>
        <Text
          variant="titleSmall"
          style={{ fontWeight: "700", marginBottom: 4 }}
        >
          Quan Sát Chung
        </Text>
        <Text
          variant="bodySmall"
          style={{ color: theme.colors.outline, marginBottom: 16 }}
        >
          {studentName} · {formatDate(session?.session_date || "")} ·{" "}
          {formatFloatTime(session?.start_time || 0)}
        </Text>

        <Picker
          label="Điểm danh *"
          value={observation.attendance}
          options={ATTENDANCE_OPTIONS}
          onChange={(v) => setObservation({ attendance: v })}
        />

        <Picker
          label="Tâm trạng học sinh"
          value={observation.mood}
          options={MOOD_OPTIONS}
          onChange={(v) => setObservation({ mood: v })}
        />

        <Picker
          label="Mức năng lượng"
          value={observation.energy_level}
          options={ENERGY_OPTIONS}
          onChange={(v) => setObservation({ energy_level: v })}
        />

        <Picker
          label="Mức độ tập trung"
          value={observation.engagement_level}
          options={ENGAGEMENT_OPTIONS}
          onChange={(v) => setObservation({ engagement_level: v })}
        />

        <Picker
          label="Kết quả tổng thể buổi học"
          value={observation.overall_performance}
          options={PERFORMANCE_OPTIONS}
          onChange={(v) => setObservation({ overall_performance: v })}
        />

        <TextInput
          label="Ghi chú tổng buổi học (tùy chọn)"
          value={observation.notes || ""}
          onChangeText={(v) => setObservation({ notes: v })}
          mode="outlined"
          multiline
          numberOfLines={3}
          style={{ marginTop: 8 }}
        />
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: theme.colors.surface }]}>
        <Button mode="outlined" onPress={() => navigation.goBack()}>
          ← Quay lại kết quả MT
        </Button>
        <Button
          mode="contained"
          onPress={() => navigation.navigate("EvalStep3", { sessionId })}
        >
          Tiếp →
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 32 },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
});
