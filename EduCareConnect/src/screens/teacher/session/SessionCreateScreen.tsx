import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import {
  Text,
  Button,
  useTheme,
  Modal,
  Portal,
  Divider,
  HelperText,
} from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StepIndicator } from "../../../components/common/StepIndicator";
import { ObjectiveCard } from "../../../components/iep/ObjectiveCard";
import { SectionHeader } from "../../../components/common/SectionHeader";
import { StatusBadge } from "../../../components/common/StatusBadge";
import { ProgressBar } from "../../../components/common/ProgressBar";
import { LoadingOverlay } from "../../../components/common/LoadingOverlay";
import {
  useCreateSession,
  useStudentActiveObjectives,
} from "../../../hooks/useSessions";
import { useGoalsByIds } from "../../../hooks/useIep";
import {
  checkStudentSessionConflict,
  type ConflictSession,
} from "../../../api/sessionApi";
import { formatFloatTime, formatDate } from "../../../utils/formatters";
import { useStudentsWithActivePlan } from "../../../hooks/useStudents";
import { Picker } from "../../../components/form/Picker";
import { DatePickerField } from "../../../components/form/DatePickerField";
import {
  TimePickerField,
  type TimeValue,
} from "../../../components/form/TimePickerField";
import {
  LOCATION_LABELS,
  SESSION_TYPE_LABELS,
  toPickerOptions,
} from "../../../utils/labels";
import type { IepGoal } from "../../../types";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { SessionStackParamList } from "../../../navigation/types";

type Props = NativeStackScreenProps<SessionStackParamList, "SessionCreate">;

const STEPS = ["Thông tin", "Mục tiêu & Xác nhận"];
const LOCATION_OPTIONS = toPickerOptions(LOCATION_LABELS);
const TYPE_OPTIONS = toPickerOptions(SESSION_TYPE_LABELS);

// ── Data helpers ──────────────────────────────────────────────────

function refId(ref: any): number {
  if (Array.isArray(ref)) return ref[0] ?? 0;
  return ref?.id ?? 0;
}
function refName(ref: any): string {
  if (Array.isArray(ref)) return ref[1] ?? "";
  return ref?.name ?? "";
}

interface GoalWithObjs {
  goal: IepGoal;
  objectives: any[];
}
interface DomainSection {
  domainId: number;
  domainName: string;
  goals: GoalWithObjs[];
}

function buildDomainSections(
  goals: IepGoal[],
  objectives: any[],
): DomainSection[] {
  // map goal_id → objectives
  const objsByGoal = new Map<number, any[]>();
  for (const obj of objectives) {
    const gid = refId(obj.goal_id);
    if (!objsByGoal.has(gid)) objsByGoal.set(gid, []);
    objsByGoal.get(gid)!.push(obj);
  }

  const domainMap = new Map<number, DomainSection>();
  for (const goal of goals) {
    const domainId = refId(goal.goal_domain_id);
    const domainName = refName(goal.goal_domain_id) || "Chưa phân loại";
    const goalObjs = objsByGoal.get(goal.id) ?? [];
    if (goalObjs.length === 0) continue; // skip goals with no active objectives

    if (!domainMap.has(domainId)) {
      domainMap.set(domainId, { domainId, domainName, goals: [] });
    }
    domainMap.get(domainId)!.goals.push({ goal, objectives: goalObjs });
  }
  return Array.from(domainMap.values());
}

// ── SelectGoalCard ────────────────────────────────────────────────

interface SelectGoalCardProps {
  goalWithObjs: GoalWithObjs;
  selectedObjIds: Set<number>;
  onToggleObj: (id: number) => void;
}

function SelectGoalCard({
  goalWithObjs,
  selectedObjIds,
  onToggleObj,
}: SelectGoalCardProps) {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);
  const { goal, objectives } = goalWithObjs;

  const selectedCount = objectives.filter((o) =>
    selectedObjIds.has(o.id),
  ).length;
  const allSelected =
    selectedCount === objectives.length && objectives.length > 0;

  const toggleAll = () => {
    if (allSelected) {
      objectives.forEach((o) => {
        if (selectedObjIds.has(o.id)) onToggleObj(o.id);
      });
    } else {
      objectives.forEach((o) => {
        if (!selectedObjIds.has(o.id)) onToggleObj(o.id);
      });
    }
  };

  return (
    <View style={[gcStyles.card, { backgroundColor: theme.colors.surface }]}>
      {/* ── Header tap to expand ── */}
      <TouchableOpacity
        onPress={() => setExpanded((v) => !v)}
        activeOpacity={0.72}
      >
        <View style={gcStyles.header}>
          <Text variant="labelSmall" style={{ color: theme.colors.outline }}>
            [{goal.goal_code}]
          </Text>
          <StatusBadge status={goal.status} size="small" />
        </View>

        <Text
          variant="bodyMedium"
          numberOfLines={expanded ? undefined : 2}
          style={[gcStyles.goalName, { color: theme.colors.onSurface }]}
        >
          {goal.name}
        </Text>

        <View style={gcStyles.progressRow}>
          <ProgressBar
            progress={goal.progress_pct || 0}
            label=""
            size="small"
          />
          <Text
            variant="labelSmall"
            style={[gcStyles.progressPct, { color: theme.colors.outline }]}
          >
            {Math.round(goal.progress_pct || 0)}%
          </Text>
        </View>

        <View style={gcStyles.toggleRow}>
          <Text
            variant="labelSmall"
            style={{ color: theme.colors.onSurfaceVariant }}
          >
            {expanded ? "" : `${objectives.length} mục tiêu ngắn hạn`}
          </Text>
          <View style={gcStyles.toggleRight}>
            {selectedCount > 0 && (
              <View
                style={[
                  gcStyles.badge,
                  { backgroundColor: theme.colors.primary },
                ]}
              >
                <Text style={gcStyles.badgeText}>{selectedCount}</Text>
              </View>
            )}
            <Text variant="labelSmall" style={{ color: theme.colors.primary }}>
              {expanded ? "Thu gọn" : "Chọn mục tiêu"}
            </Text>
            <MaterialCommunityIcons
              name={expanded ? "chevron-up" : "chevron-down"}
              size={18}
              color={theme.colors.primary}
            />
          </View>
        </View>
      </TouchableOpacity>

      {/* ── Expanded: select-all + objectives ── */}
      {expanded && (
        <View
          style={[
            gcStyles.objectivesWrap,
            { borderTopColor: theme.colors.outlineVariant },
          ]}
        >
          <TouchableOpacity
            style={gcStyles.selectAllRow}
            onPress={toggleAll}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name={
                allSelected
                  ? "checkbox-marked"
                  : selectedCount > 0
                    ? "minus-box-outline"
                    : "checkbox-blank-outline"
              }
              size={20}
              color={
                selectedCount > 0 ? theme.colors.primary : theme.colors.outline
              }
            />
            <Text
              variant="labelMedium"
              style={{ color: theme.colors.primary, marginLeft: 8, flex: 1 }}
            >
              {allSelected ? "Bỏ chọn tất cả" : "Chọn tất cả"}
            </Text>
            <Text variant="labelSmall" style={{ color: theme.colors.outline }}>
              {selectedCount}/{objectives.length}
            </Text>
          </TouchableOpacity>
          <Divider />
          <View style={{ paddingTop: 8 }}>
            {objectives.map((obj) => (
              <ObjectiveCard
                key={obj.id}
                objective={obj}
                selectable
                selected={selectedObjIds.has(obj.id)}
                onSelect={onToggleObj}
              />
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const gcStyles = StyleSheet.create({
  card: {
    borderRadius: 12,
    marginBottom: 10,
    elevation: 1,
    // shadowColor: "#000",
    // shadowOpacity: 0.05,
    // shadowRadius: 4,
    // shadowOffset: { width: 0, height: 2 },
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 4,
  },
  goalName: {
    paddingHorizontal: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  progressPct: { width: 34, textAlign: "right" },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingBottom: 12,
  },
  toggleRight: { flexDirection: "row", alignItems: "center", gap: 4 },
  badge: {
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  objectivesWrap: {
    borderTopWidth: 1,
    paddingHorizontal: 10,
    paddingBottom: 8,
  },
  selectAllRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
});

// ── Form types ────────────────────────────────────────────────────

interface FormData {
  student_id: number;
  session_date: string;
  start_time: TimeValue;
  end_time: TimeValue;
  location: string;
  session_type: string;
  session_purpose: string;
}

// ── Screen ────────────────────────────────────────────────────────

export function SessionCreateScreen({ route, navigation }: Props) {
  const theme = useTheme();
  const [step, setStep] = useState(0);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const { data: students = [] } = useStudentsWithActivePlan();
  const createMutation = useCreateSession();

  // Ensure SessionList is always behind us so hardware back doesn't get stuck
  useEffect(() => {
    const state = navigation.getState();
    const hasSessionListBehind = state.routes.some(
      (r: any) => r.name === "SessionList",
    );
    if (!hasSessionListBehind) {
      navigation.reset({
        index: 1,
        routes: [
          { name: "SessionList" },
          { name: "SessionCreate", params: route.params },
        ],
      });
    }
  }, []);

  const [form, setForm] = useState<FormData>({
    student_id: route.params?.studentId ?? 0,
    session_date: new Date().toISOString().split("T")[0],
    start_time: { hours: 8, minutes: 0 },
    end_time: { hours: 9, minutes: 0 },
    location: "center",
    session_type: "individual",
    session_purpose: "intervention",
  });

  // ── Conflict check ───────────────────────────────────────────────
  const [daySessions, setDaySessions] = useState<ConflictSession[]>([]);
  const [conflictModalVisible, setConflictModalVisible] = useState(false);
  const [conflictChecking, setConflictChecking] = useState(false);

  // Debounced fetch — only for inline red-border UI feedback while user edits
  useEffect(() => {
    if (!form.student_id || !form.session_date) {
      setDaySessions([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const sessions = await checkStudentSessionConflict(
          form.student_id,
          form.session_date,
        );
        setDaySessions(sessions);
      } catch {
        setDaySessions([]);
      }
    }, 450);
    return () => clearTimeout(t);
  }, [form.student_id, form.session_date]);

  const timeOverlap = useMemo(() => {
    if (!daySessions.length) return false;
    const toFloat = (t: TimeValue) => t.hours + t.minutes / 60;
    const s = toFloat(form.start_time);
    const e = toFloat(form.end_time);
    return daySessions.some(
      (c) => Math.max(c.start_time, s) < Math.min(c.end_time, e),
    );
  }, [daySessions, form.start_time, form.end_time]);

  // ── Step 2 data
  const { data: objectives = [], isLoading: objLoading } =
    useStudentActiveObjectives(step === 1 ? form.student_id : 0);

  const goalIds = useMemo(
    () => [...new Set(objectives.map((o) => refId(o.goal_id)).filter(Boolean))],
    [objectives],
  );

  const { data: goals = [], isLoading: goalsLoading } = useGoalsByIds(
    step === 1 ? goalIds : [],
  );

  const domainSections = useMemo(
    () => buildDomainSections(goals, objectives),
    [goals, objectives],
  );

  const [selectedObjIds, setSelectedObjIds] = useState<Set<number>>(new Set());

  const updateForm = (key: keyof FormData, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const validateStep1 = (): boolean => {
    if (!form.student_id) {
      Alert.alert("Lỗi", "Vui lòng chọn học sinh");
      return false;
    }
    if (!form.session_date) {
      Alert.alert("Lỗi", "Vui lòng chọn ngày");
      return false;
    }
    const toFloat = (t: TimeValue) => t.hours + t.minutes / 60;
    if (toFloat(form.end_time) <= toFloat(form.start_time)) {
      Alert.alert("Lỗi", "Giờ kết thúc phải sau giờ bắt đầu");
      return false;
    }
    return true;
  };

  const handleNext = async () => {
    if (!validateStep1()) return;

    // Always do a fresh check at the moment of Next press so we don't rely on
    // the debounced state which may not have resolved yet.
    if (form.student_id && form.session_date) {
      setConflictChecking(true);
      try {
        const sessions = await checkStudentSessionConflict(
          form.student_id,
          form.session_date,
        );
        setDaySessions(sessions);

        const toFloat = (t: TimeValue) => t.hours + t.minutes / 60;
        const s = toFloat(form.start_time);
        const e = toFloat(form.end_time);
        const hasConflict = sessions.some(
          (c) => Math.max(c.start_time, s) < Math.min(c.end_time, e),
        );
        if (hasConflict) {
          setConflictModalVisible(true);
          return;
        }
      } catch {
        // If the conflict API fails, allow proceeding rather than blocking forever
      } finally {
        setConflictChecking(false);
      }
    }

    setStep(1);
  };

  const toggleObjective = (id: number) => {
    setSelectedObjIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSave = async () => {
    try {
      const toFloat = (t: TimeValue) => t.hours + t.minutes / 60;
      await createMutation.mutateAsync({
        student_id: form.student_id,
        session_date: form.session_date,
        start_time: toFloat(form.start_time),
        end_time: toFloat(form.end_time),
        location: form.location,
        session_type: form.session_type,
        session_purpose: form.session_purpose,
        objective_ids: [[6, 0, Array.from(selectedObjIds)]],
      });
      setSuccessModalVisible(true);
    } catch (e: any) {
      Alert.alert("Lỗi", e.message || "Không thể tạo buổi học");
    }
  };

  const studentName =
    students.find((s) => s.id === form.student_id)?.name ?? "";
  const isStep2Loading = objLoading || (goalIds.length > 0 && goalsLoading);
  const totalSelected = selectedObjIds.size;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StepIndicator steps={STEPS} currentStep={step} />

      {/* ── Step 1: Thông tin cơ bản ─────────────────────────────── */}
      {step === 0 && (
        <ScrollView contentContainerStyle={styles.content}>
          <Text
            variant="titleSmall"
            style={{ fontWeight: "700", marginBottom: 16 }}
          >
            Bước 1: Thông Tin Cơ Bản
          </Text>

          <Picker
            label="Học sinh"
            value={form.student_id}
            options={students.map((s) => ({
              value: s.id,
              label: s.name || "",
            }))}
            onChange={(v) => updateForm("student_id", v)}
          />
          <DatePickerField
            label="Ngày học"
            value={form.session_date}
            onChange={(v) => updateForm("session_date", v)}
          />
          <View style={styles.timeRow}>
            <TimePickerField
              label="Bắt đầu"
              value={form.start_time}
              onChange={(v: TimeValue) => updateForm("start_time", v)}
              error={timeOverlap}
            />
            <TimePickerField
              label="Kết thúc"
              value={form.end_time}
              onChange={(v: TimeValue) => updateForm("end_time", v)}
              error={timeOverlap}
            />
          </View>
          {timeOverlap && (
            <View style={styles.inlineError}>
              <MaterialCommunityIcons
                name="alert-circle-outline"
                size={15}
                color="#B71C1C"
              />
              <Text variant="labelSmall" style={styles.inlineErrorText}>
                Giờ học bị trùng với lịch đã có — vui lòng chọn giờ khác
              </Text>
            </View>
          )}
          <Picker
            label="Địa điểm"
            value={form.location}
            options={LOCATION_OPTIONS}
            onChange={(v) => updateForm("location", v)}
          />
          <Picker
            label="Loại buổi học"
            value={form.session_type}
            options={TYPE_OPTIONS}
            onChange={(v) => updateForm("session_type", v)}
          />

          <Button
            mode="contained"
            onPress={handleNext}
            style={styles.btn}
            loading={conflictChecking}
            disabled={conflictChecking}
          >
            Tiếp theo →
          </Button>
        </ScrollView>
      )}

      {/* ── Step 2: Chọn mục tiêu theo domain → goal ─────────────── */}
      {step === 1 && (
        <ScrollView contentContainerStyle={styles.content}>
          {/* Sub-header */}
          <View style={styles.step2Header}>
            <View style={{ flex: 1 }}>
              <Text variant="titleSmall" style={{ fontWeight: "700" }}>
                Bước 2: Chọn Mục Tiêu
              </Text>
              <Text
                variant="bodySmall"
                style={{ color: theme.colors.outline, marginTop: 2 }}
              >
                {studentName}
              </Text>
            </View>
            {totalSelected > 0 && (
              <View
                style={[
                  styles.selectedBadge,
                  { backgroundColor: theme.colors.primary },
                ]}
              >
                <Text style={styles.selectedBadgeText}>
                  {totalSelected} đã chọn
                </Text>
              </View>
            )}
          </View>

          {isStep2Loading ? (
            <LoadingOverlay visible />
          ) : domainSections.length === 0 ? (
            <View style={styles.emptyWrap}>
              <MaterialCommunityIcons
                name="clipboard-text-off-outline"
                size={48}
                color={theme.colors.outline}
              />
              <Text
                variant="bodyMedium"
                style={{
                  color: theme.colors.outline,
                  marginTop: 12,
                  textAlign: "center",
                }}
              >
                Không có mục tiêu đang hoạt động
              </Text>
            </View>
          ) : (
            domainSections.map((section) => (
              <View key={section.domainId}>
                <SectionHeader icon="tag-outline" title={section.domainName} />
                {section.goals.map((gwo) => (
                  <SelectGoalCard
                    key={gwo.goal.id}
                    goalWithObjs={gwo}
                    selectedObjIds={selectedObjIds}
                    onToggleObj={toggleObjective}
                  />
                ))}
              </View>
            ))
          )}

          <View style={styles.btnRow}>
            <Button mode="outlined" onPress={() => setStep(0)}>
              ← Quay lại
            </Button>
            <Button
              mode="contained"
              onPress={handleSave}
              loading={createMutation.isPending}
              disabled={createMutation.isPending}
            >
              Lưu lịch học
            </Button>
          </View>
        </ScrollView>
      )}

      <Portal>
        {/* ── Conflict modal ─────────────────────────────────────── */}
        <Modal
          visible={conflictModalVisible}
          onDismiss={() => setConflictModalVisible(false)}
          contentContainerStyle={[
            styles.modal,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <View style={styles.conflictModalContent}>
            {/* Header */}
            <View style={styles.conflictIconWrap}>
              <MaterialCommunityIcons
                name="calendar-alert"
                size={40}
                color="#E65100"
              />
            </View>
            <Text
              variant="titleMedium"
              style={{
                fontWeight: "800",
                textAlign: "center",
                marginTop: 12,
                color: "#B71C1C",
              }}
            >
              Trùng lịch học
            </Text>
            <Text
              variant="bodySmall"
              style={{
                color: theme.colors.onSurfaceVariant,
                textAlign: "center",
                marginTop: 6,
                lineHeight: 18,
              }}
            >
              {studentName ? `${studentName} đã` : "Học sinh đã"} có lịch học
              trùng giờ.{"\n"}
              Vui lòng chọn khung giờ khác.
            </Text>

            {/* Day sessions list */}
            <View
              style={[
                styles.conflictListWrap,
                { borderColor: theme.colors.outlineVariant },
              ]}
            >
              <Text
                variant="labelSmall"
                style={{
                  color: theme.colors.outline,
                  marginBottom: 8,
                  fontWeight: "700",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                Lịch đã có — {formatDate(form.session_date)}
              </Text>
              {daySessions.map((s, i) => {
                const toFloat = (t: TimeValue) => t.hours + t.minutes / 60;
                const newStart = toFloat(form.start_time);
                const newEnd = toFloat(form.end_time);
                const isConflict =
                  Math.max(s.start_time, newStart) <
                  Math.min(s.end_time, newEnd);
                return (
                  <View
                    key={s.id}
                    style={[
                      styles.conflictRow,
                      {
                        backgroundColor: isConflict
                          ? "#FFEBEE"
                          : theme.colors.surfaceVariant,
                        borderColor: isConflict ? "#EF9A9A" : "transparent",
                      },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={
                        isConflict ? "clock-alert-outline" : "clock-outline"
                      }
                      size={16}
                      color={isConflict ? "#C62828" : theme.colors.outline}
                    />
                    <Text
                      variant="bodySmall"
                      style={{
                        marginLeft: 8,
                        fontWeight: isConflict ? "700" : "400",
                        color: isConflict ? "#C62828" : theme.colors.onSurface,
                      }}
                    >
                      {formatFloatTime(s.start_time)} –{" "}
                      {formatFloatTime(s.end_time)}
                    </Text>
                    {isConflict && (
                      <Text
                        variant="labelSmall"
                        style={{
                          marginLeft: "auto",
                          color: "#C62828",
                          fontWeight: "700",
                        }}
                      >
                        ⚠ Trùng giờ
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>

            <Button
              mode="contained"
              buttonColor="#C62828"
              style={{ marginTop: 4, borderRadius: 10 }}
              contentStyle={{ paddingVertical: 4 }}
              onPress={() => setConflictModalVisible(false)}
            >
              Đóng và chỉnh sửa lại
            </Button>
          </View>
        </Modal>

        {/* ── Success modal ───────────────────────────────────────── */}
        <Modal
          visible={successModalVisible}
          onDismiss={() => {}}
          contentContainerStyle={[
            styles.modal,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <View style={styles.modalContent}>
            <MaterialCommunityIcons
              name="check-circle"
              size={56}
              color={theme.colors.primary}
            />
            <Text
              variant="titleMedium"
              style={{ fontWeight: "700", marginTop: 16, textAlign: "center" }}
            >
              Tạo buổi học thành công!
            </Text>
            <Text
              variant="bodySmall"
              style={{
                color: theme.colors.onSurfaceVariant,
                marginTop: 8,
                textAlign: "center",
              }}
            >
              Buổi học đã được lưu vào lịch.
            </Text>
            <Button
              mode="contained"
              style={{ marginTop: 24, minWidth: 120 }}
              onPress={() => {
                setSuccessModalVisible(false);
                navigation.reset({
                  index: 0,
                  routes: [{ name: "SessionList" }],
                });
              }}
            >
              Đóng
            </Button>
          </View>
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 32 },
  timeRow: { flexDirection: "row", gap: 12 },
  btn: { marginTop: 24 },
  btnRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 24,
    gap: 12,
  },
  step2Header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  selectedBadge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  selectedBadgeText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  emptyWrap: {
    alignItems: "center",
    paddingVertical: 40,
  },
  inlineError: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: -8,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  inlineErrorText: { color: "#B71C1C", flex: 1, lineHeight: 16 },
  modal: {
    marginHorizontal: 24,
    borderRadius: 20,
    overflow: "hidden",
  },
  modalContent: {
    padding: 32,
    alignItems: "center",
  },
  // Conflict modal
  conflictModalContent: {
    padding: 24,
    alignItems: "center",
  },
  conflictIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#FFF3E0",
    alignItems: "center",
    justifyContent: "center",
  },
  conflictListWrap: {
    width: "100%",
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
    marginBottom: 16,
    gap: 8,
  },
  conflictRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
  },
});
