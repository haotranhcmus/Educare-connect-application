import React from "react";
import { View, ScrollView, StyleSheet, Alert } from "react-native";
import { Text, Button, Surface, useTheme } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StepIndicator } from "../../../components/common/StepIndicator";
import { useEvalStore } from "../../../store/evalStore";
import { useSubmitEval } from "../../../hooks/useEval";
import {
  useSessionDetail,
  useSessionObjectives,
} from "../../../hooks/useSessions";
import { formatDate, formatFloatTime } from "../../../utils/formatters";
import { PROMPT_LEVEL_LABELS } from "../../../utils/labels";
import type { ResultInput } from "../../../api/evalApi";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { TeacherSessionStackParamList } from "../../../navigation/types";

type Props = NativeStackScreenProps<TeacherSessionStackParamList, "EvalStep3">;

const STEPS = ["Mục tiêu", "Xác nhận"];

function getAccuracyMeta(accuracy: number, theme: any) {
  if (accuracy >= 80)
    return { color: "#2E7D32", bg: "#E8F5E9", label: "Tốt" };
  if (accuracy >= 50)
    return { color: "#E65100", bg: "#FFF3E0", label: "Trung bình" };
  return { color: theme.colors.error, bg: "#FFEBEE", label: "Cần cải thiện" };
}

export function EvalStep3Screen({ route, navigation }: Props) {
  const { sessionId } = route.params;
  const theme = useTheme();
  const { data: session } = useSessionDetail(sessionId);
  const { data: sessionObjectives = [] } = useSessionObjectives(
    session?.objective_ids ?? [],
  );
  const results = useEvalStore((s) => s.results);
  const reset = useEvalStore((s) => s.reset);
  const submitMutation = useSubmitEval();

  const studentName = Array.isArray(session?.student_id)
    ? session.student_id[1]
    : "";
  const resultsArray = Array.from(results.values());
  const totalCorrect = resultsArray.reduce(
    (sum, r) => sum + r.correct_trials,
    0,
  );
  const totalTrials = resultsArray.reduce(
    (sum, r) => sum + r.total_trials,
    0,
  );
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
      });
      reset();
      navigation.navigate("SessionDetail", { sessionId });
    } catch (e: any) {
      Alert.alert("Lỗi", e.message || "Không thể hoàn thành đánh giá");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StepIndicator steps={STEPS} currentStep={1} />

      <ScrollView contentContainerStyle={styles.content}>
        {/* ── Hero summary card ───────────────────────── */}
        <Surface
          style={[
            styles.heroCard,
            { backgroundColor: theme.colors.primaryContainer },
          ]}
          elevation={0}
        >
          <View style={styles.heroTop}>
            <MaterialCommunityIcons
              name="clipboard-check-outline"
              size={36}
              color={theme.colors.primary}
            />
            <View style={{ flex: 1 }}>
              <Text
                variant="titleMedium"
                style={{
                  fontWeight: "700",
                  color: theme.colors.onPrimaryContainer,
                }}
              >
                Tóm Tắt Buổi Học
              </Text>
              <Text
                variant="bodySmall"
                style={{
                  color: theme.colors.onPrimaryContainer,
                  opacity: 0.85,
                  marginTop: 2,
                }}
                numberOfLines={1}
              >
                {studentName} · {formatDate(session?.session_date || "")} ·{" "}
                {formatFloatTime(session?.start_time || 0)}
              </Text>
            </View>
          </View>

          {/* Aggregate stats */}
          <View style={styles.heroStatsRow}>
            <HeroStat
              icon="target"
              label="Mục tiêu"
              value={String(resultsArray.length)}
              color={theme.colors.primary}
            />
            <View style={styles.heroDivider} />
            <HeroStat
              icon="check-circle-outline"
              label="Đúng / Tổng"
              value={`${totalCorrect}/${totalTrials}`}
              color={theme.colors.primary}
            />
            <View style={styles.heroDivider} />
            <HeroStat
              icon="percent-outline"
              label="Trung bình"
              value={`${avgAccuracy}%`}
              color={theme.colors.primary}
              emphasis
            />
          </View>
        </Surface>

        {/* ── Per-objective result cards ──────────────── */}
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons
            name="format-list-bulleted"
            size={16}
            color={theme.colors.primary}
          />
          <Text
            variant="labelLarge"
            style={{ fontWeight: "700", color: theme.colors.primary }}
          >
            Kết Quả Mục Tiêu ({resultsArray.length})
          </Text>
        </View>

        {resultsArray.map((r, idx) => (
          <ResultCard
            key={r.objective_id}
            index={idx}
            total={resultsArray.length}
            result={r}
            objectives={sessionObjectives}
            theme={theme}
          />
        ))}
      </ScrollView>

      {/* ── Footer ────────────────────────────────── */}
      <Surface
        style={[styles.footer, { backgroundColor: theme.colors.surface }]}
        elevation={3}
      >
        <Button
          mode="outlined"
          icon="arrow-left"
          onPress={() => navigation.goBack()}
          style={styles.footerBtn}
          disabled={submitMutation.isPending}
        >
          Quay lại
        </Button>
        <Button
          mode="contained"
          icon="check-circle"
          onPress={handleConfirm}
          loading={submitMutation.isPending}
          disabled={submitMutation.isPending}
          style={styles.footerBtn}
        >
          Hoàn tất
        </Button>
      </Surface>
    </View>
  );
}

// ── Hero stat ────────────────────────────────────────────────────────────────────
function HeroStat({
  icon,
  label,
  value,
  color,
  emphasis,
}: {
  icon: any;
  label: string;
  value: string;
  color: string;
  emphasis?: boolean;
}) {
  return (
    <View style={styles.heroStat}>
      <MaterialCommunityIcons name={icon} size={16} color={color} />
      <Text
        style={[
          styles.heroStatValue,
          emphasis && { fontSize: 22 },
          { color },
        ]}
      >
        {value}
      </Text>
      <Text style={[styles.heroStatLabel, { color }]}>{label}</Text>
    </View>
  );
}

// ── Per-objective result card ────────────────────────────────────────────────────
function ResultCard({
  index,
  total,
  result,
  objectives,
  theme,
}: {
  index: number;
  total: number;
  result: ResultInput;
  objectives: any[];
  theme: any;
}) {
  const obj = objectives.find((o) => o.id === result.objective_id);
  const accuracy =
    result.total_trials > 0
      ? Math.round((result.correct_trials / result.total_trials) * 100)
      : 0;
  const acc = getAccuracyMeta(accuracy, theme);
  const promptLabel =
    PROMPT_LEVEL_LABELS[result.prompt_level_used] ||
    result.prompt_level_used ||
    "—";
  const code =
    obj?.objective_code ||
    `STO-${String(result.objective_id).padStart(3, "0")}`;

  return (
    <Surface style={styles.resultCard} elevation={1}>
      {/* Top row: index pill + code badge + accuracy chip */}
      <View style={styles.resultTopRow}>
        <View
          style={[
            styles.indexPill,
            { backgroundColor: theme.colors.surfaceVariant },
          ]}
        >
          <Text
            style={[
              styles.indexPillText,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            {index + 1}/{total}
          </Text>
        </View>
        <View
          style={[
            styles.codeBadge,
            { backgroundColor: theme.colors.primaryContainer },
          ]}
        >
          <Text style={[styles.codeText, { color: theme.colors.primary }]}>
            {code}
          </Text>
        </View>
        <View style={{ flex: 1 }} />
        <View style={[styles.accuracyChip, { backgroundColor: acc.bg }]}>
          <Text style={[styles.accuracyChipText, { color: acc.color }]}>
            {accuracy}%
          </Text>
        </View>
      </View>

      {/* Objective name */}
      {obj?.name ? (
        <Text
          variant="bodyMedium"
          style={[styles.objName, { color: theme.colors.onSurface }]}
          numberOfLines={2}
        >
          {obj.name}
        </Text>
      ) : null}

      {/* Accuracy progress bar */}
      <View style={styles.progressSection}>
        <View
          style={[
            styles.progressTrack,
            { backgroundColor: theme.colors.surfaceVariant },
          ]}
        >
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.min(accuracy, 100)}%`,
                backgroundColor: acc.color,
              },
            ]}
          />
        </View>
      </View>

      {/* Stats row */}
      <View
        style={[
          styles.statsRow,
          {
            backgroundColor: theme.colors.surfaceVariant,
            borderColor: theme.colors.outlineVariant,
          },
        ]}
      >
        <View style={styles.statCell}>
          <Text style={styles.statLabel}>Số lần đúng</Text>
          <View style={styles.statValueRow}>
            <Text style={[styles.statBig, { color: theme.colors.onSurface }]}>
              {result.correct_trials}
            </Text>
            <Text
              style={[
                styles.statSmall,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              /{result.total_trials}
            </Text>
          </View>
        </View>
        <View
          style={[styles.vRule, { backgroundColor: theme.colors.outlineVariant }]}
        />
        <View style={styles.statCell}>
          <Text style={styles.statLabel}>Kết quả</Text>
          <Text style={[styles.statBig, { color: acc.color }]}>
            {acc.label}
          </Text>
        </View>
        <View
          style={[styles.vRule, { backgroundColor: theme.colors.outlineVariant }]}
        />
        <View style={[styles.statCell, { flex: 1.3 }]}>
          <Text style={styles.statLabel}>Mức gợi ý</Text>
          <Text
            style={[styles.statBig, { color: theme.colors.onSurface }]}
            numberOfLines={2}
            adjustsFontSizeToFit
            minimumFontScale={0.8}
          >
            {promptLabel}
          </Text>
        </View>
      </View>

      {result.notes ? (
        <View style={styles.notesRow}>
          <MaterialCommunityIcons
            name="note-text-outline"
            size={14}
            color={theme.colors.outline}
            style={{ marginTop: 2 }}
          />
          <Text
            variant="bodySmall"
            style={{ color: theme.colors.onSurfaceVariant, flex: 1 }}
          >
            {result.notes}
          </Text>
        </View>
      ) : null}
    </Surface>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 100 },

  // Hero summary
  heroCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    gap: 14,
  },
  heroTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  heroStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.55)",
    borderRadius: 12,
    paddingVertical: 10,
  },
  heroStat: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  heroStatValue: { fontSize: 18, fontWeight: "800" },
  heroStatLabel: { fontSize: 10, fontWeight: "600", opacity: 0.85 },
  heroDivider: {
    width: 1,
    height: 28,
    backgroundColor: "rgba(0,0,0,0.1)",
  },

  // Section header
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },

  // Result card
  resultCard: {
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    backgroundColor: "#fff",
    gap: 10,
  },
  resultTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  indexPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  indexPillText: { fontSize: 11, fontWeight: "700" },
  codeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  codeText: { fontSize: 11, fontWeight: "700", letterSpacing: 0.3 },
  accuracyChip: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    minWidth: 52,
    alignItems: "center",
  },
  accuracyChipText: { fontSize: 13, fontWeight: "800" },
  objName: { fontWeight: "500", lineHeight: 20 },
  progressSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 3 },

  statsRow: {
    flexDirection: "row",
    borderRadius: 10,
    borderWidth: 1,
    overflow: "hidden",
  },
  statCell: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 4,
    gap: 2,
  },
  statLabel: {
    fontSize: 10,
    color: "#999",
    textAlign: "center",
    fontWeight: "500",
  },
  statValueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 1,
  },
  statBig: {
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
  statSmall: { fontSize: 12, fontWeight: "400" },
  vRule: {
    width: 1,
    alignSelf: "stretch",
    marginVertical: 8,
  },
  notesRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    paddingTop: 4,
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
