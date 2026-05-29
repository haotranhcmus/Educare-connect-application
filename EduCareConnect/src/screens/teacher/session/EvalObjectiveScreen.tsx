import React, {
  useState,
  useEffect,
  useLayoutEffect,
  useCallback,
} from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  TouchableOpacity,
} from "react-native";
import {
  Text,
  TextInput,
  Button,
  useTheme,
  Surface,
  ProgressBar as PaperProgress,
} from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StepIndicator } from "@components/common/StepIndicator";
import { LoadingOverlay } from "@components/common/LoadingOverlay";
import { useSessionDetail, useSessionObjectives } from "@hooks/useSessions";
import { formatDate, formatFloatTime } from "@utils/formatters";
import {
  PROMPT_LEVEL_LABELS,
  PROMPT_LEVEL_WEIGHTS,
  MEASUREMENT_TYPE_LABELS,
} from "@utils/labels";
import { useEvalStore } from "@store/evalStore";
import type { ResultInput } from "@api/evalApi";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { TeacherSessionStackParamList } from "@navigation/types";
import { SafeAreaView } from "react-native-safe-area-context";

type Props = NativeStackScreenProps<
  TeacherSessionStackParamList,
  "EvalObjective"
>;

const STEPS = ["Mục tiêu", "Xác nhận"];

const STAR_BLACK = require("../../../../assets/star/star-black.png");
const STAR_YELLOW = require("../../../../assets/star/star-yellow.png");
// const ICON_MEASURANT = require("../../../../assets/result/measurant.png");
const ICON_RESULT = require("../../../../assets/result/result.png");

// Prompt levels ordered worst → best so star count (index + 1) maps intuitively:
// 1 sao = no_response (0%) … 5 sao = independent (100%).
const LEVELS_BY_STARS = [
  "no_response",
  "physical",
  "verbal",
  "gestural_visual",
  "independent",
];

// Guidance lines (text) for non-prompt measurement types.
const GUIDANCE: Record<string, string[]> = {
  accuracy: [
    "Đếm số lần trẻ làm ĐÚNG trên TỔNG số lần thử trong buổi.",
    "Nhập 'Số lần đúng' và 'Tổng số lần'.",
    "Điểm = số lần đúng / tổng số lần × 100%.",
  ],
  duration: [
    "Đo THỜI GIAN trẻ duy trì hành vi mục tiêu (tính bằng giây).",
    "Nhập số giây thực tế đạt được.",
    "Điểm = thời gian thực tế / thời gian mục tiêu × 100% (tối đa 100%).",
  ],
  frequency_increase: [
    "Đếm SỐ LẦN hành vi tích cực xuất hiện — càng nhiều càng tốt.",
    "Nhập số lần thực tế.",
    "Điểm = số lần thực tế ÷ số lần mục tiêu × 100% (tối đa 100%).",
  ],
  frequency_decrease: [
    "Đếm SỐ LẦN hành vi tiêu cực xuất hiện — càng ÍT càng tốt.",
    "Nhập số lần thực tế.",
    "Điểm tính theo mức giảm so với cơ sở; đạt ngưỡng mục tiêu = 100%.",
  ],
};

// Star ↔ support-level mapping shown in the prompt_level guidance card.
const PROMPT_GUIDE_ROWS = [
  { stars: 5, label: "Độc lập hoàn toàn", pct: 100 },
  { stars: 4, label: "Nhắc bằng cử chỉ / hình ảnh", pct: 75 },
  { stars: 3, label: "Nhắc bằng lời nói", pct: 50 },
  { stars: 2, label: "Hỗ trợ thể chất", pct: 25 },
  { stars: 1, label: "Từ chối / Không phản hồi", pct: 0 },
];

export function EvalObjectiveScreen({ route, navigation }: Props) {
  const { sessionId, objectiveIndex = 0 } = route.params;
  const theme = useTheme();
  const { setResult: storeSetResult, skipObjective } = useEvalStore();
  const results = useEvalStore((s) => s.results);
  const storeSessionId = useEvalStore((s) => s.sessionId);
  const setStoreSessionId = useEvalStore((s) => s.setSessionId);

  // Reset eval draft whenever the user enters a *different* session's eval
  // flow. Without this, leftover results/skipped from an unsubmitted previous
  // session would leak into the new one's EvalConfirm screen.
  // Navigating forward (push objectiveIndex+1) keeps the same sessionId, so
  // mid-flow drafts are preserved.
  useEffect(() => {
    if (storeSessionId !== sessionId) {
      setStoreSessionId(sessionId);
    }
  }, [sessionId, storeSessionId, setStoreSessionId]);

  const { data: session, isLoading: sessionLoading } =
    useSessionDetail(sessionId);
  const sessionObjectiveIds = session?.objective_ids ?? [];
  const { data: objectives = [], isLoading: objLoading } =
    useSessionObjectives(sessionObjectiveIds);

  const objective = objectives[objectiveIndex];
  const savedResult = objective ? results.get(objective.id) : undefined;
  const totalCount = objectives.length;
  const isLast = objectiveIndex >= totalCount - 1;
  const isFirst = objectiveIndex === 0;

  const measurementType = objective?.measurement_type ?? "accuracy";

  // ── Form state (per measurement type) ──
  const [correct, setCorrect] = useState(
    String(savedResult?.correct_trials ?? ""),
  );
  const [totalTrials, setTotalTrials] = useState(
    String(savedResult?.total_trials ?? ""),
  );
  const [numTrials, setNumTrials] = useState(
    String(savedResult?.trial_prompts?.length ?? ""),
  );
  const [trialLevels, setTrialLevels] = useState<string[]>(
    savedResult?.trial_prompts ?? [],
  );
  const initSavedSec = savedResult?.actual_duration_seconds ?? 0;
  const [durationMode, setDurationMode] = useState<"minsec" | "seconds">(
    "minsec",
  );
  const [durationMin, setDurationMin] = useState(
    initSavedSec >= 60 ? String(Math.floor(initSavedSec / 60)) : "",
  );
  const [durationSecPart, setDurationSecPart] = useState(
    initSavedSec > 0 ? String(initSavedSec % 60) : "",
  );
  const [durationSec, setDurationSec] = useState(
    String(savedResult?.actual_duration_seconds ?? ""),
  );
  const [count, setCount] = useState(String(savedResult?.actual_count ?? ""));
  const [notes, setNotes] = useState(savedResult?.notes || "");
  const [formError, setFormError] = useState("");
  const [showGuide, setShowGuide] = useState(false);

  // Reset form when objective changes
  useEffect(() => {
    if (!objective) return;
    const saved = results.get(objective.id);
    setCorrect(String(saved?.correct_trials ?? ""));
    setTotalTrials(String(saved?.total_trials ?? ""));
    setNumTrials(String(saved?.trial_prompts?.length ?? ""));
    setTrialLevels(saved?.trial_prompts ?? []);
    const sSec = saved?.actual_duration_seconds ?? 0;
    setDurationSec(String(sSec || ""));
    setDurationMin(sSec >= 60 ? String(Math.floor(sSec / 60)) : "");
    setDurationSecPart(sSec > 0 ? String(sSec % 60) : "");
    setDurationMode("minsec");
    setCount(String(saved?.actual_count ?? ""));
    setNotes(saved?.notes || "");
    setFormError("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [objective?.id]);

  // Resize per-trial prompt list when the trial count changes (prompt_level).
  const handleNumTrialsChange = (v: string) => {
    setNumTrials(v);
    setFormError("");
    const n = Number(v);
    if (v === "" || isNaN(n) || n <= 0) {
      setTrialLevels([]);
      return;
    }
    const capped = Math.min(n, 50);
    setTrialLevels((prev) => {
      const next = prev.slice(0, capped);
      while (next.length < capped) next.push("verbal");
      return next;
    });
  };

  const setTrialLevel = (idx: number, level: string) => {
    setTrialLevels((prev) => {
      const next = [...prev];
      next[idx] = level;
      return next;
    });
  };

  // Derived: total seconds the user entered for duration, regardless of mode.
  const durationTotal =
    durationMode === "minsec"
      ? (Number(durationMin) || 0) * 60 + (Number(durationSecPart) || 0)
      : Number(durationSec) || 0;

  const toggleDurationMode = () => {
    setFormError("");
    if (durationMode === "minsec") {
      const total =
        (Number(durationMin) || 0) * 60 + (Number(durationSecPart) || 0);
      setDurationSec(total ? String(total) : "");
      setDurationMode("seconds");
    } else {
      const total = Number(durationSec) || 0;
      setDurationMin(total >= 60 ? String(Math.floor(total / 60)) : "");
      setDurationSecPart(total > 0 ? String(total % 60) : "");
      setDurationMode("minsec");
    }
  };

  // ── Live normalized score (0–100) per measurement type ──
  let scorePct = 0;
  if (measurementType === "accuracy") {
    const t = Number(totalTrials);
    scorePct = t > 0 ? (Number(correct) / t) * 100 : 0;
  } else if (measurementType === "prompt_level") {
    if (trialLevels.length > 0) {
      scorePct =
        trialLevels.reduce((s, l) => s + (PROMPT_LEVEL_WEIGHTS[l] ?? 0), 0) /
        trialLevels.length;
    }
  } else if (measurementType === "duration") {
    const tgt = objective?.target_duration_seconds ?? 0;
    scorePct = tgt > 0 ? Math.min(durationTotal / tgt, 1) * 100 : 0;
  } else if (measurementType === "frequency_increase") {
    const tgt = objective?.target_count ?? 0;
    scorePct = tgt > 0 ? Math.min(Number(count) / tgt, 1) * 100 : 0;
  } else if (measurementType === "frequency_decrease") {
    const b = objective?.baseline_count ?? 0;
    const tgt = objective?.target_count ?? 0;
    const denom = b - tgt;
    scorePct =
      denom > 0
        ? Math.max(0, Math.min((b - Number(count)) / denom, 1)) * 100
        : 0;
  }
  scorePct = Math.round(scorePct);

  const scoreColor =
    scorePct >= 80
      ? "#2E7D32"
      : scorePct >= 50
        ? "#E65100"
        : theme.colors.error;

  const validate = (): boolean => {
    if (measurementType === "accuracy") {
      const t = Number(totalTrials);
      const c = Number(correct);
      if (!totalTrials || isNaN(t) || t <= 0) {
        setFormError("Tổng số lần thử phải lớn hơn 0");
        return false;
      }
      if (correct === "" || isNaN(c) || c < 0 || c > t) {
        setFormError("Số lần đúng phải trong khoảng 0–tổng số lần");
        return false;
      }
    } else if (measurementType === "prompt_level") {
      if (trialLevels.length === 0) {
        setFormError("Nhập số lần thử và chọn mức hỗ trợ cho từng lần");
        return false;
      }
    } else if (measurementType === "duration") {
      if (durationMode === "minsec") {
        if (durationMin === "" && durationSecPart === "") {
          setFormError("Nhập phút và/hoặc giây.");
          return false;
        }
        if (durationTotal < 0) {
          setFormError("Thời gian không được âm.");
          return false;
        }
      } else if (
        durationSec === "" ||
        isNaN(Number(durationSec)) ||
        Number(durationSec) < 0
      ) {
        setFormError("Thời gian thực tế không hợp lệ (≥ 0 giây).");
        return false;
      }
    } else {
      const a = Number(count);
      if (count === "" || isNaN(a) || a < 0) {
        setFormError("Số lần thực tế không hợp lệ (≥ 0)");
        return false;
      }
    }
    setFormError("");
    return true;
  };

  /**
   * Drop the current objective from this session permanently. The skip is
   * cached in evalStore until submit, where the backend unlinks it from
   * session.objective_ids — so after Hoàn tất the objective leaves no trace
   * in this session's history. There is no undo after submit.
   */
  const handleSkip = useCallback(() => {
    if (!objective) return;
    Alert.alert(
      "Bỏ qua mục tiêu?",
      `Mục tiêu "${objective.name}" sẽ bị loại khỏi buổi học này và KHÔNG được ghi vào lịch sử. Hành động không hoàn tác sau khi bấm Hoàn tất.`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Bỏ qua",
          style: "destructive",
          onPress: () => {
            skipObjective(objective.id);
            if (isLast) {
              navigation.navigate("EvalConfirm", { sessionId });
            } else {
              navigation.push("EvalObjective", {
                sessionId,
                objectiveIndex: objectiveIndex + 1,
              });
            }
          },
        },
      ],
    );
  }, [objective, isLast, navigation, sessionId, objectiveIndex, skipObjective]);

  // Header "Bỏ qua" button. Disabled while objective is loading.
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () =>
        objective ? (
          <TouchableOpacity
            onPress={handleSkip}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
              paddingHorizontal: 8,
            }}
          >
            <Text
              style={{
                color: "#d6ffce",
                fontWeight: "600",
                fontSize: 13,
                width: 60,
              }}
            >
              Bỏ qua
            </Text>
          </TouchableOpacity>
        ) : null,
    });
  }, [navigation, handleSkip, objective, theme.colors.error]);

  const handleNext = () => {
    if (objective) {
      const result: ResultInput = {
        objective_id: objective.id,
        measurement_type: measurementType,
        notes,
        score_pct: scorePct,
      };
      if (measurementType === "accuracy") {
        result.correct_trials = Number(correct);
        result.total_trials = Number(totalTrials);
      } else if (measurementType === "prompt_level") {
        result.trial_prompts = trialLevels;
      } else if (measurementType === "duration") {
        result.actual_duration_seconds = durationTotal;
      } else {
        result.actual_count = Number(count);
      }
      storeSetResult(objective.id, result);
    }
    if (isLast) {
      navigation.navigate("EvalConfirm", { sessionId });
    } else {
      navigation.push("EvalObjective", {
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
      <StepIndicator
        steps={STEPS}
        currentStep={0}
        objectiveIndex={objectiveIndex}
        totalObjectives={totalCount}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "padding"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 24}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Objective card ────────────────────────────── */}
          <Surface style={styles.objectiveCard} elevation={1}>
            <View style={styles.objectiveHeader}>
              <View
                style={[
                  styles.codeBadge,
                  { backgroundColor: theme.colors.primaryContainer },
                ]}
              >
                <Text
                  style={[styles.codeText, { color: theme.colors.primary }]}
                >
                  {objective.objective_code}
                </Text>
              </View>
              <Text
                variant="bodyLarge"
                style={{
                  flex: 1,
                  fontWeight: "600",
                  color: theme.colors.onSurface,
                }}
              >
                {objective.name}
              </Text>
            </View>

            {/* {goalName ? (
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
            ) : null} */}
          </Surface>

          {/* ── Measurement type card ─────────────────────── */}
          <Surface style={styles.typeCard} elevation={1}>
            {/* <View style={styles.typeIconWrap}>
              <Image
                source={ICON_MEASURANT}
                style={styles.typeIconImg}
                resizeMode="contain"
              />
            </View> */}
            <View style={{ flex: 1 }}>
              <Text
                style={[styles.typeEyebrow, { color: theme.colors.outline }]}
              >
                CÁCH ĐÁNH GIÁ
              </Text>
              <Text
                variant="bodyMedium"
                style={{ fontWeight: "700", color: theme.colors.onSurface }}
              >
                {MEASUREMENT_TYPE_LABELS[measurementType] || measurementType}
              </Text>
            </View>
          </Surface>

          {/* ── Eval form card ────────────────────────────── */}
          <Surface style={styles.formCard} elevation={1}>
            <View style={styles.formHeader}>
              <Image
                source={ICON_RESULT}
                style={styles.headerIconImg}
                resizeMode="contain"
              />
              <Text
                variant="titleSmall"
                style={{ fontWeight: "700", color: theme.colors.primary }}
              >
                Nhập kết quả
              </Text>
              <View style={{ flex: 1 }} />
              <TouchableOpacity
                style={styles.guideBtn}
                onPress={() => setShowGuide((g) => !g)}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name="help-circle-outline"
                  size={16}
                  color={theme.colors.primary}
                />
                <Text
                  style={{
                    color: theme.colors.primary,
                    fontWeight: "600",
                    fontSize: 12,
                  }}
                >
                  Hướng dẫn
                </Text>
              </TouchableOpacity>
            </View>

            {showGuide && (
              <View
                style={[
                  styles.guideCard,
                  {
                    backgroundColor: theme.colors.surfaceVariant,
                    borderColor: theme.colors.outlineVariant,
                  },
                ]}
              >
                <View style={styles.guideHeader}>
                  <Text
                    style={[styles.guideTitle, { color: theme.colors.primary }]}
                  >
                    Hướng dẫn nhập
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowGuide(false)}
                    hitSlop={8}
                  >
                    <MaterialCommunityIcons
                      name="close-circle"
                      size={20}
                      color={theme.colors.outline}
                    />
                  </TouchableOpacity>
                </View>

                {measurementType === "prompt_level" ? (
                  <View style={{ gap: 8 }}>
                    <Text
                      style={[
                        styles.guideIntro,
                        { color: theme.colors.onSurfaceVariant },
                      ]}
                    >
                      Mỗi lần thử, chọn số sao theo mức hỗ trợ trẻ cần:
                    </Text>
                    {PROMPT_GUIDE_ROWS.map((r) => (
                      <View key={r.stars} style={styles.guideStarRow}>
                        <View style={styles.guideStars}>
                          {[0, 1, 2, 3, 4].map((i) => (
                            <Image
                              key={i}
                              source={i < r.stars ? STAR_YELLOW : STAR_BLACK}
                              style={styles.guideStarImg}
                              resizeMode="contain"
                            />
                          ))}
                        </View>
                        <Text
                          style={[
                            styles.guideRowText,
                            { color: theme.colors.onSurface, flex: 1 },
                          ]}
                        >
                          {r.label} ({r.pct}%)
                        </Text>
                      </View>
                    ))}
                    <Text
                      style={[
                        styles.guideNote,
                        { color: theme.colors.onSurfaceVariant },
                      ]}
                    >
                      Điểm = trung bình các lần thử.
                    </Text>
                  </View>
                ) : (
                  <View style={{ gap: 6 }}>
                    {(GUIDANCE[measurementType] || []).map((line, i) => (
                      <View key={i} style={styles.guideBulletRow}>
                        <MaterialCommunityIcons
                          name="circle-medium"
                          size={16}
                          color={theme.colors.primary}
                        />
                        <Text
                          style={[
                            styles.guideRowText,
                            { color: theme.colors.onSurface, flex: 1 },
                          ]}
                        >
                          {line}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* Type 0: accuracy */}
            {measurementType === "accuracy" && (
              <View style={styles.trialRow}>
                <View style={{ flex: 1 }}>
                  <TextInput
                    label="Số lần đúng *"
                    value={correct}
                    onChangeText={(v) => {
                      setCorrect(v);
                      if (formError) setFormError("");
                    }}
                    keyboardType="numeric"
                    mode="outlined"
                    dense
                    style={styles.trialInput}
                    outlineStyle={styles.inputOutline}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <TextInput
                    label="Tổng số lần *"
                    value={totalTrials}
                    onChangeText={(v) => {
                      setTotalTrials(v);
                      if (formError) setFormError("");
                    }}
                    keyboardType="numeric"
                    mode="outlined"
                    dense
                    style={styles.trialInput}
                    outlineStyle={styles.inputOutline}
                  />
                </View>
              </View>
            )}

            {/* Type 1: prompt level (per-trial) */}
            {measurementType === "prompt_level" && (
              <View>
                <TextInput
                  label="Số lần thử *"
                  value={numTrials}
                  onChangeText={handleNumTrialsChange}
                  keyboardType="numeric"
                  mode="outlined"
                  dense
                  style={styles.trialInput}
                  outlineStyle={styles.inputOutline}
                />
                {trialLevels.map((lvl, idx) => {
                  const selIdx = LEVELS_BY_STARS.indexOf(lvl);
                  return (
                    <View key={idx} style={styles.trialStarRow}>
                      <Text variant="labelSmall" style={styles.trialLabel}>
                        Lần thử {idx + 1}
                      </Text>
                      <View style={styles.starRow}>
                        {LEVELS_BY_STARS.map((_, si) => (
                          <TouchableOpacity
                            key={si}
                            onPress={() =>
                              setTrialLevel(idx, LEVELS_BY_STARS[si])
                            }
                            activeOpacity={0.7}
                          >
                            <Image
                              source={si <= selIdx ? STAR_YELLOW : STAR_BLACK}
                              style={styles.starImg}
                              resizeMode="contain"
                            />
                          </TouchableOpacity>
                        ))}
                      </View>
                      <Text
                        style={[
                          styles.trialLevelText,
                          { color: theme.colors.onSurfaceVariant },
                        ]}
                      >
                        {PROMPT_LEVEL_LABELS[lvl]}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Type 2: duration */}
            {measurementType === "duration" && (
              <View>
                {durationMode === "minsec" ? (
                  <View style={styles.trialRow}>
                    <View style={{ flex: 1 }}>
                      <TextInput
                        label="Phút"
                        value={durationMin}
                        onChangeText={(v) => {
                          setDurationMin(v);
                          if (formError) setFormError("");
                        }}
                        keyboardType="numeric"
                        mode="outlined"
                        dense
                        style={styles.trialInput}
                        outlineStyle={styles.inputOutline}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <TextInput
                        label="Giây"
                        value={durationSecPart}
                        onChangeText={(v) => {
                          setDurationSecPart(v);
                          if (formError) setFormError("");
                        }}
                        keyboardType="numeric"
                        mode="outlined"
                        dense
                        style={styles.trialInput}
                        outlineStyle={styles.inputOutline}
                      />
                    </View>
                  </View>
                ) : (
                  <TextInput
                    label="Số giây"
                    value={durationSec}
                    onChangeText={(v) => {
                      setDurationSec(v);
                      if (formError) setFormError("");
                    }}
                    keyboardType="numeric"
                    mode="outlined"
                    dense
                    style={styles.trialInput}
                    outlineStyle={styles.inputOutline}
                  />
                )}
                <TouchableOpacity
                  style={styles.durationToggle}
                  onPress={toggleDurationMode}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons
                    name="swap-horizontal"
                    size={16}
                    color={theme.colors.primary}
                  />
                  <Text
                    style={{
                      color: theme.colors.primary,
                      fontWeight: "600",
                      fontSize: 12,
                    }}
                  >
                    {durationMode === "minsec"
                      ? "Đổi sang số giây"
                      : "Đổi sang phút : giây"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Type 3: frequency */}
            {(measurementType === "frequency_increase" ||
              measurementType === "frequency_decrease") && (
              <View>
                <TextInput
                  label="Số lần xuất hiện hành vi"
                  value={count}
                  onChangeText={(v) => {
                    setCount(v);
                    if (formError) setFormError("");
                  }}
                  keyboardType="numeric"
                  mode="outlined"
                  dense
                  style={styles.trialInput}
                  outlineStyle={styles.inputOutline}
                />
              </View>
            )}

            {formError ? (
              <Text style={styles.errorText}>{formError}</Text>
            ) : null}

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
      </KeyboardAvoidingView>

      {/* ── Footer ────────────────────────────────────── */}
      <SafeAreaView
        style={[styles.footer, { backgroundColor: theme.colors.surface }]}
        edges={["bottom"]}
      >
        <Button
          mode="outlined"
          icon={isFirst ? "" : "arrow-left"}
          onPress={() => navigation.goBack()}
          style={styles.footerBtn}
        >
          {isFirst ? "Hủy" : "Quay lại"}
        </Button>
        <Button
          mode="contained"
          icon={isLast ? "" : "arrow-right"}
          onPress={() => {
            if (!validate()) return;
            handleNext();
          }}
          style={styles.footerBtn}
          contentStyle={{ flexDirection: "row-reverse" }}
        >
          {isLast ? "Xác nhận" : `Tiếp tục`}
        </Button>
      </SafeAreaView>
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
  trialInput: { backgroundColor: "transparent" },
  typeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "#fff",
    marginBottom: 12,
  },
  typeIconWrap: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  typeIconImg: {
    width: 34,
    height: 34,
  },
  headerIconImg: {
    width: 22,
    height: 22,
  },
  typeEyebrow: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.4,
    marginBottom: 1,
  },
  guideBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  durationToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginTop: 4,
  },
  guideCard: {
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    marginBottom: 4,
    gap: 8,
    borderWidth: 1,
  },
  guideHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  guideTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  guideIntro: {
    fontSize: 13,
    lineHeight: 18,
  },
  guideStarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  guideStars: {
    flexDirection: "row",
    gap: 1,
  },
  guideStarImg: {
    width: 16,
    height: 16,
  },
  guideRowText: {
    fontSize: 13,
    lineHeight: 18,
  },
  guideNote: {
    fontSize: 12,
    fontStyle: "italic",
    marginTop: 2,
  },
  guideBulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 4,
  },
  trialStarRow: {
    marginTop: 14,
    gap: 4,
  },
  starRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 2,
  },
  starImg: {
    width: 30,
    height: 30,
  },
  trialLevelText: {
    fontSize: 12,
    marginTop: 2,
  },
  trialLabel: {
    fontWeight: "700",
    marginBottom: 4,
    marginLeft: 2,
  },
  hintText: {
    color: "#757575",
    marginTop: 6,
    marginLeft: 2,
  },
  errorText: {
    fontSize: 11,
    color: "#B00020",
    marginTop: 3,
    marginLeft: 4,
  },
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
