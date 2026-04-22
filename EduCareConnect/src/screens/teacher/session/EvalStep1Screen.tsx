import React, { useState, useRef, useCallback, useEffect } from "react";
import { View, ScrollView, StyleSheet, LayoutChangeEvent } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  Text,
  Button,
  ProgressBar as PaperProgress,
  useTheme,
} from "react-native-paper";
import { StepIndicator } from "../../../components/common/StepIndicator";
import { ResultInputCard } from "../../../components/session/ResultInputCard";
import { LoadingOverlay } from "../../../components/common/LoadingOverlay";
import {
  useSessionDetail,
  useSessionObjectives,
} from "../../../hooks/useSessions";
import { formatDate, formatFloatTime } from "../../../utils/formatters";
import type { ResultInput } from "../../../api/evalApi";
import { useEvalStore } from "../../../store/evalStore";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { TeacherSessionStackParamList } from "../../../navigation/types";

type Props = NativeStackScreenProps<TeacherSessionStackParamList, "EvalStep1">;

const STEPS = ["Kết quả MT", "Quan sát", "Xác nhận"];

export function EvalStep1Screen({ route, navigation }: Props) {
  const { sessionId } = route.params;
  const theme = useTheme();
  const { setResult: storeSetResult, setSessionId: storeSetSessionId } =
    useEvalStore();

  // Reset store once when this eval session starts. Must run before user
  // enters any results so storeSetSessionId (which clears results) fires first.
  useEffect(() => {
    storeSetSessionId(sessionId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);
  const { data: session, isLoading: sessionLoading } =
    useSessionDetail(sessionId);

  const sessionObjectiveIds = session?.objective_ids ?? [];
  const studentName = Array.isArray(session?.student_id)
    ? session.student_id[1]
    : "";
  const { data: objectives = [], isLoading: objLoading } =
    useSessionObjectives(sessionObjectiveIds);

  // Results map: objective_id -> ResultInput
  const [resultsMap, setResultsMap] = useState<Map<number, ResultInput>>(
    new Map(),
  );
  const [activeObjId, setActiveObjId] = useState<number | null>(null);

  const scrollRef = useRef<ScrollView>(null);
  const cardPositions = useRef<Map<number, number>>(new Map());

  const savedCount = resultsMap.size;
  const totalCount = objectives.length;
  const allDone = totalCount > 0 && savedCount === totalCount;

  const handleSaveResult = useCallback(
    (objId: number, result: ResultInput) => {
      setResultsMap((prev) => new Map(prev).set(objId, result));
      storeSetResult(objId, result);
      setActiveObjId(null);

      // Auto-scroll to next pending
      const nextPending = objectives.find(
        (o) => o.id !== objId && !resultsMap.has(o.id),
      );
      if (nextPending) {
        const y = cardPositions.current.get(nextPending.id);
        if (y != null) {
          setTimeout(
            () => scrollRef.current?.scrollTo({ y: y - 100, animated: true }),
            300,
          );
        }
        setActiveObjId(nextPending.id);
      }
    },
    [objectives, resultsMap],
  );

  const handleCardLayout = (objId: number, e: LayoutChangeEvent) => {
    cardPositions.current.set(objId, e.nativeEvent.layout.y);
  };

  const handleNext = () => {
    // storeSetSessionId is called on mount — do NOT call it here because
    // setSessionId resets the results Map, wiping everything already saved.
    navigation.navigate("EvalStep2", {
      sessionId,
      // Pass results via route params (serialized)
      // In production, consider a shared eval store
    });
  };

  if (sessionLoading || objLoading) return <LoadingOverlay visible />;
  if (!session) return null;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StepIndicator steps={STEPS} currentStep={0} />

      {/* Sticky context bar */}
      <View
        style={[styles.contextBar, { backgroundColor: theme.colors.surface }]}
      >
        <Text variant="bodySmall">
          {studentName} · {formatDate(session.session_date)} ·{" "}
          {formatFloatTime(session.start_time)}
        </Text>
        <PaperProgress
          progress={totalCount > 0 ? savedCount / totalCount : 0}
          color={theme.colors.primary}
          style={{ marginVertical: 4 }}
        />
        <Text
          variant="labelSmall"
          style={{
            color: allDone ? theme.colors.primary : theme.colors.outline,
          }}
        >
          {allDone ? (
            <MaterialCommunityIcons
              name="check-circle"
              size={14}
              color={theme.colors.primary}
            />
          ) : null}{" "}
          Đã nhập: {savedCount} / {totalCount} mục tiêu
        </Text>
      </View>

      <ScrollView ref={scrollRef} contentContainerStyle={styles.content}>
        {objectives.map((obj, idx) => (
          <View key={obj.id} onLayout={(e) => handleCardLayout(obj.id, e)}>
            <ResultInputCard
              index={idx}
              total={totalCount}
              objective={obj}
              savedResult={resultsMap.get(obj.id)}
              isActive={activeObjId === obj.id}
              onSave={(r) => handleSaveResult(obj.id, r)}
              onEdit={() => setActiveObjId(obj.id)}
              onActivate={() => setActiveObjId(obj.id)}
            />
          </View>
        ))}
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { backgroundColor: theme.colors.surface }]}>
        <Button mode="outlined" onPress={() => navigation.goBack()}>
          ← Quay lại
        </Button>
        <Button mode="contained" onPress={handleNext} disabled={!allDone}>
          Tiếp theo →
        </Button>
      </View>
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
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
});
