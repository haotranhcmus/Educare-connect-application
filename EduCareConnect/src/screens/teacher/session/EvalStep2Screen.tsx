import React, { useState, useEffect } from "react";
import { View, ScrollView, StyleSheet, Alert } from "react-native";
import {
  Text,
  TextInput,
  Button,
  useTheme,
  Surface,
  ProgressBar as PaperProgress,
} from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StepIndicator } from "../../../components/common/StepIndicator";
import { Picker } from "../../../components/form/Picker";
import { LoadingOverlay } from "../../../components/common/LoadingOverlay";
import {
  useSessionDetail,
  useSessionObjectives,
} from "../../../hooks/useSessions";
import { formatDate, formatFloatTime } from "../../../utils/formatters";
import { PROMPT_LEVEL_LABELS, toPickerOptions } from "../../../utils/labels";
import { useEvalStore } from "../../../store/evalStore";
import type { ResultInput } from "../../../api/evalApi";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { TeacherSessionStackParamList } from "../../../navigation/types";

type Props = NativeStackScreenProps<TeacherSessionStackParamList, "EvalStep2">;

const STEPS = ["Mục tiêu", "Xác nhận"];
const PROMPT_LEVEL_OPTIONS = toPickerOptions(PROMPT_LEVEL_LABELS);

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

  // Color the live accuracy hint: red < 50, orange < 80, green ≥ 80.
  const accuracyColor =
    accuracyPct >= 80
      ? "#2E7D32"
      : accuracyPct >= 50
        ? "#E65100"
        : theme.colors.error;

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
      <StepIndicator steps={STEPS} currentStep={0} />

      {/* ── Context bar ─────────────────────────────────── */}
      <Surface
        style={[styles.contextBar, { backgroundColor: theme.colors.surface }]}
        elevation={1}
      >
        <View style={styles.contextRow}>
          <MaterialCommunityIcons
            name="account-circle-outline"
            size={16}
            color={theme.colors.outline}
          />
          <Text
            variant="labelMedium"
            style={{ color: theme.colors.onSurface, fontWeight: "600" }}
            numberOfLines={1}
          >
            {studentName}
          </Text>
          <View style={styles.contextDot} />
          <Text variant="labelSmall" style={{ color: theme.colors.outline }}>
            {formatDate(session.session_date)} ·{" "}
            {formatFloatTime(session.start_time)}
          </Text>
        </View>
        <View style={styles.progressRow}>
          <PaperProgress
            progress={totalCount > 0 ? (objectiveIndex + 1) / totalCount : 0}
            color={theme.colors.primary}
            style={styles.progressBar}
          />
          <Text
            variant="labelSmall"
            style={{ color: theme.colors.primary, fontWeight: "700" }}
          >
            {objectiveIndex + 1}/{totalCount}
          </Text>
        </View>
      </Surface>

      <ScrollView contentContainerStyle={styles.content}>
        {/* ── Objective card ────────────────────────────── */}
        <Surface style={styles.objectiveCard} elevation={1}>
          <View style={styles.objectiveHeader}>
            <View
              style={[
                styles.codeBadge,
                { backgroundColor: theme.colors.primaryContainer },
              ]}
            >
              <Text style={[styles.codeText, { color: theme.colors.primary }]}>
                {objective.objective_code}
              </Text>
            </View>
            <Text
              variant="bodyMedium"
              style={{
                flex: 1,
                fontWeight: "600",
                color: theme.colors.onSurface,
              }}
            >
              {objective.name}
            </Text>
          </View>

          {goalName ? (
            <View style={styles.goalRow}>
              <MaterialCommunityIcons
                name="tag-outline"
                size={13}
                color={theme.colors.outline}
              />
              <Text
                variant="labelSmall"
                style={{
                  color: theme.colors.onSurfaceVariant,
                  flexShrink: 1,
                }}
              >
                {goalName}
              </Text>
            </View>
          ) : null}
        </Surface>

        {/* ── Eval form card ────────────────────────────── */}
        <Surface style={styles.formCard} elevation={1}>
          <View style={styles.formHeader}>
            <MaterialCommunityIcons
              name="clipboard-edit-outline"
              size={18}
              color={theme.colors.primary}
            />
            <Text
              variant="titleSmall"
              style={{ fontWeight: "700", color: theme.colors.primary }}
            >
              Nhập kết quả
            </Text>
          </View>

          <View style={styles.trialRow}>
            <TextInput
              label="Số lần đúng *"
              value={correct}
              onChangeText={setCorrect}
              keyboardType="numeric"
              mode="outlined"
              dense
              style={styles.trialInput}
              outlineStyle={styles.inputOutline}
            />
            <TextInput
              label="Tổng số lần *"
              value={totalTrials}
              onChangeText={setTotalTrials}
              keyboardType="numeric"
              mode="outlined"
              dense
              style={styles.trialInput}
              outlineStyle={styles.inputOutline}
            />
          </View>

          <View style={{ marginTop: 12 }}>
            <Picker
              label="Mức hỗ trợ *"
              value={prompt}
              options={PROMPT_LEVEL_OPTIONS}
              onChange={setPrompt}
            />
          </View>

          <TextInput
            label="Ghi chú (tùy chọn)"
            value={notes}
            onChangeText={setNotes}
            mode="outlined"
            multiline
            numberOfLines={4}
            dense
            outlineStyle={styles.inputOutline}
          />
        </Surface>
      </ScrollView>

      {/* ── Footer ────────────────────────────────────── */}
      <Surface
        style={[styles.footer, { backgroundColor: theme.colors.surface }]}
        elevation={3}
      >
        <Button
          mode="outlined"
          icon="arrow-left"
          onPress={() => navigation.goBack()}
          style={styles.footerBtn}
        >
          Quay lại
        </Button>
        <Button
          mode="contained"
          icon={isLast ? "check" : "arrow-right"}
          onPress={() => {
            if (!totalTrials || Number(totalTrials) === 0) {
              Alert.alert(
                "Thiếu thông tin",
                "Vui lòng nhập tổng số lần trước khi tiếp tục",
              );
              return;
            }
            handleNext();
          }}
          style={styles.footerBtn}
          contentStyle={{ flexDirection: "row-reverse" }}
        >
          {isLast ? "Xác nhận" : `Mục tiêu ${objectiveIndex + 2}`}
        </Button>
      </Surface>
    </View>
  );
}

// ── StatPill ─────────────────────────────────────────────────────────────────────
function StatPill({
  label,
  value,
  color,
  bg,
  accent,
}: {
  label: string;
  value: string;
  color: string;
  bg: string;
  accent?: boolean;
}) {
  return (
    <View
      style={[
        styles.statPill,
        {
          backgroundColor: bg,
          borderWidth: accent ? 1.5 : 0,
          borderColor: accent ? color : "transparent",
        },
      ]}
    >
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  contextBar: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.06)",
  },
  contextRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  contextDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#BDBDBD",
    marginHorizontal: 2,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  progressBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
  },

  content: { padding: 16, paddingBottom: 100 },

  // Objective card
  objectiveCard: {
    padding: 14,
    borderRadius: 14,
    marginBottom: 14,
    backgroundColor: "#fff",
    gap: 10,
  },
  objectiveHeader: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 10,
  },
  codeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  codeText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  goalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  statPill: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    alignItems: "center",
    gap: 2,
  },
  statValue: { fontSize: 18, fontWeight: "800", lineHeight: 22 },
  statLabel: { fontSize: 10, fontWeight: "600", textAlign: "center" },

  // Form card
  formCard: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#fff",
  },
  formHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  trialRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  trialInput: { flex: 1, backgroundColor: "transparent" },
  inputOutline: { borderRadius: 10 },
  accuracyPreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginTop: 10,
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
});
