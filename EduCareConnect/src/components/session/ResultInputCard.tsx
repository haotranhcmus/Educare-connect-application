import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { Text, TextInput, Button, useTheme } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Picker } from "../form/Picker";
import type { IepObjectiveListItem } from "../../types";
import type { ResultInput } from "../../api/evalApi";

interface ResultInputCardProps {
  index: number;
  total: number;
  objective: IepObjectiveListItem;
  savedResult?: ResultInput;
  isActive: boolean;
  onSave: (result: ResultInput) => void;
  onEdit: () => void;
  onActivate: () => void;
}

const RESULT_TYPES = [
  { value: "trial_by_trial", label: "Trial-by-Trial" },
  { value: "probe", label: "Probe" },
  { value: "whole_task", label: "Whole Task" },
  { value: "partial_interval", label: "Khoảng thời gian một phần" },
  { value: "momentary_time", label: "Khoảng thời điểm" },
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

const PROMPT_SHORT: Record<string, string> = {
  independent: "Độc lập",
  verbal_prompt: "Nhắc lời",
  gestural_prompt: "Cử chỉ",
  partial_physical: "Một phần",
  full_physical: "Hoàn toàn",
};

export function ResultInputCard({
  index,
  total,
  objective,
  savedResult,
  isActive,
  onSave,
  onEdit,
  onActivate,
}: ResultInputCardProps) {
  const theme = useTheme();
  const goalName = Array.isArray(objective.goal_id) ? objective.goal_id[1] : "";

  // Local form state
  const [resultType, setResultType] = useState(
    savedResult?.result_type || "trial_by_trial",
  );
  const [correct, setCorrect] = useState(
    String(savedResult?.correct_trials || ""),
  );
  const [totalTrials, setTotalTrials] = useState(
    String(savedResult?.total_trials || ""),
  );
  const [prompt, setPrompt] = useState(
    savedResult?.prompt_level_used || "independent",
  );
  const [phase, setPhase] = useState(savedResult?.phase || "intervention");
  const [notes, setNotes] = useState(savedResult?.notes || "");

  const accuracyPct =
    totalTrials && Number(totalTrials) > 0
      ? Math.round((Number(correct) / Number(totalTrials)) * 100)
      : 0;

  const handleSave = () => {
    onSave({
      objective_id: objective.id,
      result_type: resultType,
      correct_trials: Number(correct),
      total_trials: Number(totalTrials),
      prompt_level_used: prompt,
      phase,
      notes,
    });
  };

  // Collapsed done
  if (savedResult && !isActive) {
    return (
      <View
        style={[
          styles.card,
          styles.cardDone,
          { backgroundColor: theme.colors.surface },
        ]}
      >
        <View style={styles.cardHeader}>
          <MaterialCommunityIcons
            name="check-circle"
            size={20}
            color={theme.colors.primary}
          />
          <Text variant="labelMedium" style={{ marginLeft: 8, flex: 1 }}>
            MT {index + 1} / {total} · {objective.objective_code}
          </Text>
        </View>
        <Text variant="bodySmall" numberOfLines={1}>
          {objective.name}
        </Text>
        <Text
          variant="bodySmall"
          style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}
        >
          {savedResult.correct_trials}/{savedResult.total_trials} ·{" "}
          {Math.round(
            (savedResult.correct_trials / savedResult.total_trials) * 100,
          )}
          % ·{" "}
          {PROMPT_SHORT[savedResult.prompt_level_used] ||
            savedResult.prompt_level_used}
        </Text>
        <Button
          mode="text"
          compact
          onPress={onEdit}
          style={{ alignSelf: "flex-end" }}
        >
          Sửa ✏
        </Button>
      </View>
    );
  }

  // Collapsed pending
  if (!isActive) {
    return (
      <View
        style={[
          styles.card,
          styles.cardPending,
          { backgroundColor: theme.colors.surfaceVariant },
        ]}
      >
        <View style={styles.cardHeader}>
          <MaterialCommunityIcons
            name="circle-outline"
            size={20}
            color={theme.colors.outline}
          />
          <Text variant="labelMedium" style={{ marginLeft: 8, flex: 1 }}>
            MT {index + 1} / {total} · {objective.objective_code}
          </Text>
        </View>
        <Text variant="bodySmall" numberOfLines={1}>
          {objective.name}
        </Text>
        <Text
          variant="labelSmall"
          style={{ color: theme.colors.outline, marginTop: 2 }}
        >
          Hiện tại: {Math.round(objective.current_accuracy_pct || 0)}% → Mục
          tiêu: {objective.target_accuracy_pct}%
        </Text>
        <Button
          mode="text"
          compact
          onPress={onActivate}
          style={{ alignSelf: "flex-end" }}
        >
          Nhập kết quả
        </Button>
      </View>
    );
  }

  // Expanded (active)
  return (
    <View
      style={[
        styles.card,
        styles.cardActive,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.primary,
        },
      ]}
    >
      <View style={styles.cardHeader}>
        <MaterialCommunityIcons
          name="circle-outline"
          size={20}
          color={theme.colors.primary}
        />
        <Text
          variant="labelMedium"
          style={{ marginLeft: 8, flex: 1, color: theme.colors.primary }}
        >
          MT {index + 1} / {total} · {objective.objective_code}
        </Text>
      </View>
      <Text variant="bodySmall">{objective.name}</Text>
      <Text variant="labelSmall" style={{ color: theme.colors.outline }}>
        🏷 {goalName}
      </Text>
      <Text variant="labelSmall" style={{ color: theme.colors.outline }}>
        Hiện tại: {Math.round(objective.current_accuracy_pct || 0)}% → Mục tiêu:{" "}
        {objective.target_accuracy_pct}%
      </Text>

      <View style={styles.form}>
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
        <Text
          variant="bodySmall"
          style={{ color: theme.colors.primary, marginBottom: 8 }}
        >
          → Độ chính xác: {accuracyPct}%
        </Text>

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
        />

        <Button mode="contained" onPress={handleSave} style={{ marginTop: 12 }}>
          ✔ Lưu mục tiêu này
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 12, borderRadius: 12, marginBottom: 8, elevation: 1 },
  cardDone: {},
  cardPending: { opacity: 0.7 },
  cardActive: { borderWidth: 2 },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  form: { marginTop: 12 },
  trialRow: { flexDirection: "row", gap: 12, marginBottom: 4 },
});
