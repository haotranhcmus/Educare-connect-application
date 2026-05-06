import React, { useState, useEffect } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import {
  Text,
  TextInput,
  Button,
  Divider,
  useTheme,
  ProgressBar as PaperProgress,
} from "react-native-paper";
import { StepIndicator } from "../../../components/common/StepIndicator";
import { Picker } from "../../../components/form/Picker";
import { LoadingOverlay } from "../../../components/common/LoadingOverlay";
import {
  useSessionDetail,
  useSessionObjectives,
} from "../../../hooks/useSessions";
import { formatDate, formatFloatTime } from "../../../utils/formatters";
import { useEvalStore } from "../../../store/evalStore";
import type { ResultInput } from "../../../api/evalApi";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { TeacherSessionStackParamList } from "../../../navigation/types";

type Props = NativeStackScreenProps<TeacherSessionStackParamList, "EvalStep2">;

const STEPS = ["Quan sát", "Mục tiêu", "Xác nhận"];

const RESULT_TYPES = [
  { value: "trial_by_trial", label: "Trial-by-Trial" },
  { value: "probe", label: "Probe" },
  { value: "whole_task", label: "Whole Task" },
  { value: "partial_interval", label: "Khoảng thời gian một phần" },
  { value: "momentary_time_sample", label: "Khoảng thời điểm" },
];

const PROMPT_LEVELS = [
  { value: "independent", label: "Độc lập" },
  { value: "verbal_prompt", label: "Nhắc bằng lời" },
  { value: "gestural_prompt", label: "Nhắc cử chỉ" },
  { value: "partial_physical", label: "Hỗ trợ một phần" },
  { value: "full_physical", label: "Hỗ trợ hoàn toàn" },
];

const PHASES = [
  { value: "baseline", label: "Cơ sở ban đầu" },
  { value: "intervention", label: "Can thiệp" },
  { value: "maintenance", label: "Duy trì" },
  { value: "generalization", label: "Tổng quát hóa" },
];

export function EvalStep2Screen({ route, navigation }: Props) {
  const { sessionId, objectiveIndex = 0 } = route.params;
  const theme = useTheme();
  const { setResult: storeSetResult } = useEvalStore();
  const results = useEvalStore((s) => s.results);

  const { data: session, isLoading: sessionLoading } =
    useSessionDetail(sessionId);
  const sessionObjectiveIds = session?.objective_ids ?? [];
  const { data: objectives = [], isLoading: objLoading } =
    useSessionObjectives(sessionObjectiveIds);

  const objective = objectives[objectiveIndex];
  const savedResult = objective ? results.get(objective.id) : undefined;
  const totalCount = objectives.length;
  const isLast = objectiveIndex >= totalCount - 1;

  // Form state
  const [resultType, setResultType] = useState(
    savedResult?.result_type || "trial_by_trial",
  );
  const [correct, setCorrect] = useState(
    String(savedResult?.correct_trials ?? ""),
  );
  const [totalTrials, setTotalTrials] = useState(
    String(savedResult?.total_trials ?? ""),
  );
  const [prompt, setPrompt] = useState(
    savedResult?.prompt_level_used || "independent",
  );
  const [phase, setPhase] = useState(savedResult?.phase || "intervention");
  const [notes, setNotes] = useState(savedResult?.notes || "");

  // Reset form when objective changes
  useEffect(() => {
    if (!objective) return;
    const saved = results.get(objective.id);
    setResultType(saved?.result_type || "trial_by_trial");
    setCorrect(String(saved?.correct_trials ?? ""));
    setTotalTrials(String(saved?.total_trials ?? ""));
    setPrompt(saved?.prompt_level_used || "independent");
    setPhase(saved?.phase || "intervention");
    setNotes(saved?.notes || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [objective?.id]);

  const accuracyPct =
    totalTrials && Number(totalTrials) > 0
      ? Math.round((Number(correct) / Number(totalTrials)) * 100)
      : 0;

  const handleNext = () => {
    if (objective && totalTrials) {
      const result: ResultInput = {
        objective_id: objective.id,
        result_type: resultType,
        correct_trials: Number(correct),
        total_trials: Number(totalTrials),
        prompt_level_used: prompt,
        phase,
        notes,
      };
      storeSetResult(objective.id, result);
    }
    if (isLast) {
      navigation.navigate("EvalStep3", { sessionId });
    } else {
      navigation.push("EvalStep2", {
        sessionId,
        objectiveIndex: objectiveIndex + 1,
      });
    }
  };

  if (sessionLoading || objLoading) return <LoadingOverlay visible />;
  if (!session || !objective) return null;

  const studentName = Array.isArray(session.student_id)
    ? session.student_id[1]
    : "";
  const goalName = Array.isArray(objective.goal_id) ? objective.goal_id[1] : "";

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StepIndicator steps={STEPS} currentStep={1} />

      {/* Context bar */}
      <View
        style={[styles.contextBar, { backgroundColor: theme.colors.surface }]}
      >
        <Text variant="bodySmall">
          {studentName} · {formatDate(session.session_date)} ·{" "}
          {formatFloatTime(session.start_time)}
        </Text>
        <PaperProgress
          progress={totalCount > 0 ? objectiveIndex / totalCount : 0}
          color={theme.colors.primary}
          style={{ marginVertical: 4 }}
        />
        <Text variant="labelSmall" style={{ color: theme.colors.outline }}>
          Mục tiêu {objectiveIndex + 1} / {totalCount}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Objective info */}
        <Text
          variant="labelLarge"
          style={{
            color: theme.colors.primary,
            fontWeight: "700",
            marginBottom: 4,
          }}
        >
          {objective.objective_code}
        </Text>
        <Text variant="bodyMedium" style={{ marginBottom: 6 }}>
          {objective.name}
        </Text>
        {goalName ? (
          <Text
            variant="labelSmall"
            style={{ color: theme.colors.outline, marginBottom: 8 }}
          >
            🏷 {goalName}
          </Text>
        ) : null}

        {/* Accuracy stats */}
        <View style={styles.statsRow}>
          <StatChip
            label="Mức ban đầu"
            value={`${objective.baseline_accuracy_pct}%`}
            theme={theme}
            primary
          />
          <StatChip
            label="Hiện tại"
            value={`${Math.round(objective.current_accuracy_pct || 0)}%`}
            primary
            theme={theme}
          />
          <StatChip
            label="Mục tiêu"
            value={`${objective.target_accuracy_pct}%`}
            theme={theme}
            primary
          />
        </View>

        <Divider style={{ marginVertical: 12 }} />

        {/* Eval form */}
        <Picker
          label="Loại kết quả"
          value={resultType}
          options={RESULT_TYPES}
          onChange={setResultType}
        />

        <View style={styles.trialRow}>
          <View style={{ flex: 1 }}>
            <TextInput
              label="Số lần đúng *"
              value={correct}
              onChangeText={setCorrect}
              keyboardType="numeric"
              mode="outlined"
              dense
            />
          </View>
          <View style={{ flex: 1 }}>
            <TextInput
              label="Tổng số lần *"
              value={totalTrials}
              onChangeText={setTotalTrials}
              keyboardType="numeric"
              mode="outlined"
              dense
            />
          </View>
        </View>

        {totalTrials !== "" && Number(totalTrials) > 0 ? (
          <Text
            variant="bodySmall"
            style={{ color: theme.colors.primary, marginBottom: 8 }}
          >
            → Độ chính xác: {accuracyPct}%
          </Text>
        ) : null}

        <Picker
          label="Mức hỗ trợ *"
          value={prompt}
          options={PROMPT_LEVELS}
          onChange={setPrompt}
        />
        <Picker
          label="Pha thực hiện"
          value={phase}
          options={PHASES}
          onChange={setPhase}
        />

        <TextInput
          label="Ghi chú (tùy chọn)"
          value={notes}
          onChangeText={setNotes}
          mode="outlined"
          multiline
          numberOfLines={2}
          dense
          style={{ marginTop: 4 }}
        />
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: theme.colors.surface }]}>
        <Button mode="outlined" onPress={() => navigation.goBack()}>
          ← Quay lại
        </Button>
        <Button
          mode="contained"
          onPress={handleNext}
          disabled={!totalTrials || Number(totalTrials) === 0}
        >
          {isLast ? "Tiếp tục →" : `Tiếp → MT ${objectiveIndex + 2}`}
        </Button>
      </View>
    </View>
  );
}

function StatChip({
  label,
  value,
  primary = false,
  theme,
}: {
  label: string;
  value: string;
  primary?: boolean;
  theme: any;
}) {
  return (
    <View
      style={[
        styles.statChip,
        {
          backgroundColor: primary
            ? theme.colors.primaryContainer
            : theme.colors.surfaceVariant,
        },
      ]}
    >
      <Text
        variant="labelSmall"
        style={{
          color: primary
            ? theme.colors.onPrimaryContainer
            : theme.colors.outline,
          textAlign: "center",
        }}
      >
        {label}
      </Text>
      <Text
        variant="labelMedium"
        style={{
          fontWeight: "700",
          color: primary
            ? theme.colors.onPrimaryContainer
            : theme.colors.onSurface,
          textAlign: "center",
        }}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  contextBar: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  content: { padding: 16, paddingBottom: 80 },
  statsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 4,
  },
  statChip: {
    flex: 1,
    padding: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  trialRow: { flexDirection: "row", gap: 12, marginBottom: 4 },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
});
