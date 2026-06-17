import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Animated,
  Dimensions,
  Pressable,
} from "react-native";
import ReAnimated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { toast } from "@utils/toast";
import {
  Text,
  Button,
  useTheme,
  Modal,
  Portal,
  Divider,
} from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { AvatarLabel } from "@components/common/AvatarLabel";
import { StepIndicator } from "@components/common/StepIndicator";
import { ObjectiveCard } from "@components/iep/ObjectiveCard";
import { SectionHeader } from "@components/common/SectionHeader";
import { StatusBadge } from "@components/common/StatusBadge";
import { ProgressBar } from "@components/common/ProgressBar";
import { LoadingOverlay } from "@components/common/LoadingOverlay";
import {
  useCreateSession,
  useStudentActiveObjectives,
} from "@hooks/useSessions";
import { useGoalsByIds } from "@hooks/useIep";
import {
  checkStudentSessionConflict,
  type ConflictSession,
} from "@api/sessionApi";
import { formatFloatTime, formatDate } from "@utils/formatters";
import { useStudentsWithActivePlan } from "@hooks/useStudents";
import { Picker } from "@components/form/Picker";
import { DatePickerField } from "@components/form/DatePickerField";
import {
  TimePickerField,
  type TimeValue,
} from "@components/form/TimePickerField";
import { SESSION_TYPE_LABELS, toPickerOptions } from "@utils/labels";
import type { IepGoal, StudentListItem } from "@t";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { SessionStackParamList } from "@navigation/types";

type Props = NativeStackScreenProps<SessionStackParamList, "SessionCreate">;

const STEPS = ["Thông tin", "Mục tiêu & Xác nhận"];
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
              <View key={obj.id} style={{ position: "relative" }}>
                <ObjectiveCard
                  objective={obj}
                  selectable
                  selected={selectedObjIds.has(obj.id)}
                  onSelect={onToggleObj}
                />
              </View>
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
  masteredBadge: {
    position: "absolute",
    top: 8,
    right: 10,
    backgroundColor: "#2E7D32",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    zIndex: 1,
  },
  masteredBadgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },
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

// ── Student Picker ────────────────────────────────────────────────

const SHEET_HEIGHT = Dimensions.get("window").height * 0.82;

function calcAge(dob?: string): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  if (
    today.getMonth() < birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())
  )
    age--;
  return age >= 0 ? age : null;
}

function studyDuration(enrollmentDate?: string): string | null {
  if (!enrollmentDate) return null;
  const days = Math.floor(
    (Date.now() - new Date(enrollmentDate).getTime()) / 86400000,
  );
  if (days < 1) return "Mới nhập học";
  const years = Math.floor(days / 365);
  const months = Math.floor((days - years * 365) / 30);
  if (years > 0 && months > 0) return `${years} năm ${months} tháng`;
  if (years > 0) return `${years} năm`;
  if (months > 0) return `${months} tháng`;
  return `${days} ngày`;
}

function StudentPickerItem({
  student,
  isSelected,
  onPress,
}: {
  student: StudentListItem;
  isSelected: boolean;
  onPress: (id: number) => void;
}) {
  const theme = useTheme();
  const scale = useRef(new Animated.Value(1)).current;
  const age = calcAge(student.date_of_birth);
  const duration = studyDuration(student.enrollment_date);

  const onPressIn = () =>
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();
  const onPressOut = () =>
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 3,
    }).start();

  return (
    <Pressable
      onPress={() => onPress(student.id)}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
    >
      <Animated.View
        style={[
          pickerItemStyles.card,
          {
            backgroundColor: isSelected
              ? theme.colors.primaryContainer
              : theme.colors.surface,
            borderColor: isSelected
              ? theme.colors.primary
              : theme.colors.outlineVariant,
          },
          { transform: [{ scale }] },
        ]}
      >
        {/* Avatar with selection ring */}
        <View
          style={[
            pickerItemStyles.avatarRing,
            {
              borderColor: isSelected
                ? theme.colors.primary
                : `${theme.colors.primary}22`,
            },
          ]}
        >
          <AvatarLabel uri={student.avatar_url} name={student.name} size={50} />
          {isSelected && (
            <View
              style={[
                pickerItemStyles.checkBadge,
                { backgroundColor: theme.colors.primary },
              ]}
            >
              <MaterialCommunityIcons name="check" size={10} color="#fff" />
            </View>
          )}
        </View>

        {/* Info */}
        <View style={{ flex: 1, gap: 4 }}>
          {student.nickname ? (
            <>
              <Text
                style={[
                  pickerItemStyles.nickname,
                  {
                    color: isSelected
                      ? theme.colors.primary
                      : theme.colors.onSurface,
                  },
                ]}
                numberOfLines={1}
              >
                {student.nickname}
              </Text>
              <Text
                style={[
                  pickerItemStyles.fullName,
                  { color: theme.colors.onSurfaceVariant },
                ]}
                numberOfLines={1}
              >
                {student.name}
              </Text>
            </>
          ) : (
            <Text
              style={[
                pickerItemStyles.nickname,
                {
                  color: isSelected
                    ? theme.colors.primary
                    : theme.colors.onSurface,
                },
              ]}
              numberOfLines={1}
            >
              {student.name}
            </Text>
          )}

          <View style={pickerItemStyles.badgeRow}>
            {age !== null && (
              <View
                style={[
                  pickerItemStyles.badge,
                  { backgroundColor: theme.colors.surfaceVariant },
                ]}
              >
                <Text
                  style={[
                    pickerItemStyles.badgeText,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  {age} tuổi
                </Text>
              </View>
            )}
            {duration && (
              <View
                style={[
                  pickerItemStyles.badge,
                  { backgroundColor: `${theme.colors.primary}14` },
                ]}
              >
                <MaterialCommunityIcons
                  name="clock-outline"
                  size={10}
                  color={theme.colors.primary}
                />
                <Text
                  style={[
                    pickerItemStyles.badgeText,
                    { color: theme.colors.primary },
                  ]}
                >
                  {duration}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Right indicator */}
        {isSelected ? (
          <View
            style={[
              pickerItemStyles.checkCircle,
              { backgroundColor: theme.colors.primary },
            ]}
          >
            <MaterialCommunityIcons name="check" size={16} color="#fff" />
          </View>
        ) : (
          <MaterialCommunityIcons
            name="chevron-right"
            size={20}
            color={theme.colors.outline}
          />
        )}
      </Animated.View>
    </Pressable>
  );
}

const pickerItemStyles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 16,
    borderWidth: 1.5,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
  },
  avatarRing: {
    borderRadius: 30,
    borderWidth: 2,
    overflow: "visible",
  },
  checkBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  nickname: { fontSize: 16, fontWeight: "700", letterSpacing: 0.1 },
  fullName: { fontSize: 13, marginTop: -2 },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 5 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
    gap: 3,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
});

function StudentPickerSheet({
  visible,
  students,
  selectedId,
  onSelect,
  onClose,
}: {
  visible: boolean;
  students: StudentListItem[];
  selectedId: number;
  onSelect: (id: number) => void;
  onClose: () => void;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");

  const translateY = useSharedValue(SHEET_HEIGHT);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      backdropOpacity.value = withTiming(1, { duration: 280 });
      translateY.value = withSpring(0, {
        damping: 22,
        stiffness: 220,
        mass: 0.9,
      });
      setSearch("");
    } else {
      backdropOpacity.value = withTiming(0, { duration: 220 });
      translateY.value = withTiming(SHEET_HEIGHT, { duration: 260 });
    }
  }, [visible]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return students;
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.nickname?.toLowerCase().includes(q),
    );
  }, [students, search]);

  return (
    <Portal>
      {/* Backdrop */}
      <ReAnimated.View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: "rgba(0,0,0,0.52)" },
          backdropStyle,
        ]}
        pointerEvents={visible ? "auto" : "none"}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </ReAnimated.View>

      {/* Sheet */}
      <ReAnimated.View
        style={[
          pickerSheetStyles.sheet,
          {
            backgroundColor: theme.colors.background,
            height: SHEET_HEIGHT,
            paddingBottom: insets.bottom,
          },
          sheetStyle,
        ]}
        pointerEvents={visible ? "auto" : "none"}
      >
        {/* Drag handle */}
        <View style={pickerSheetStyles.handleWrap}>
          <View
            style={[
              pickerSheetStyles.handle,
              { backgroundColor: theme.colors.outlineVariant },
            ]}
          />
        </View>

        {/* Header */}
        <View
          style={[
            pickerSheetStyles.header,
            { borderBottomColor: theme.colors.outlineVariant },
          ]}
        >
          <Text
            variant="titleLarge"
            style={{ fontWeight: "800", flex: 1, letterSpacing: -0.3 }}
          >
            Chọn học sinh
          </Text>
          <View
            style={[
              pickerSheetStyles.countBadge,
              { backgroundColor: theme.colors.primaryContainer },
            ]}
          >
            <Text
              variant="labelMedium"
              style={{ color: theme.colors.primary, fontWeight: "700" }}
            >
              {students.length}
            </Text>
          </View>
          <Pressable
            onPress={onClose}
            style={[
              pickerSheetStyles.closeBtn,
              { backgroundColor: theme.colors.surfaceVariant },
            ]}
          >
            <MaterialCommunityIcons
              name="close"
              size={18}
              color={theme.colors.onSurfaceVariant}
            />
          </Pressable>
        </View>

        {/* Search bar */}
        <View
          style={[
            pickerSheetStyles.searchContainer,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <View
            style={[
              pickerSheetStyles.searchPill,
              { backgroundColor: theme.colors.surfaceVariant },
            ]}
          >
            <MaterialCommunityIcons
              name="magnify"
              size={20}
              color={theme.colors.outline}
            />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Tìm theo tên hoặc biệt danh…"
              placeholderTextColor={theme.colors.outline}
              style={[
                pickerSheetStyles.searchInput,
                { color: theme.colors.onSurface },
              ]}
              autoCorrect={false}
            />
            {search.length > 0 && (
              <Pressable onPress={() => setSearch("")}>
                <MaterialCommunityIcons
                  name="close-circle"
                  size={18}
                  color={theme.colors.outline}
                />
              </Pressable>
            )}
          </View>
        </View>

        {/* List */}
        <FlatList
          data={filtered}
          keyExtractor={(s) => String(s.id)}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 16 }}
          renderItem={({ item }) => (
            <StudentPickerItem
              student={item}
              isSelected={item.id === selectedId}
              onPress={(id) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onSelect(id);
                onClose();
              }}
            />
          )}
          ListEmptyComponent={
            <View style={pickerSheetStyles.emptyWrap}>
              <MaterialCommunityIcons
                name="account-search-outline"
                size={44}
                color={theme.colors.outline}
              />
              <Text
                variant="bodyMedium"
                style={{ color: theme.colors.outline, marginTop: 10 }}
              >
                Không tìm thấy học sinh
              </Text>
            </View>
          }
          keyboardShouldPersistTaps="handled"
        />
      </ReAnimated.View>
    </Portal>
  );
}

const pickerSheetStyles = StyleSheet.create({
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
    elevation: 16,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -4 },
  },
  handleWrap: {
    alignItems: "center",
    paddingVertical: 10,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 14,
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  countBadge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  searchPill: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
  emptyWrap: {
    alignItems: "center",
    paddingTop: 48,
  },
});

// ── Form types ────────────────────────────────────────────────────

interface FormData {
  student_id: number;
  session_date: string;
  start_time: TimeValue;
  end_time: TimeValue;
  session_type: string;
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
    session_type: "individual",
  });

  // ── Conflict check ───────────────────────────────────────────────
  const [daySessions, setDaySessions] = useState<ConflictSession[]>([]);
  const [conflictModalVisible, setConflictModalVisible] = useState(false);
  const [noObjectivesModalVisible, setNoObjectivesModalVisible] =
    useState(false);
  const [pastDateModalVisible, setPastDateModalVisible] = useState(false);
  const [conflictChecking, setConflictChecking] = useState(false);
  const [studentPickerVisible, setStudentPickerVisible] = useState(false);

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

  // Computed session purpose based on selected objectives (mirrors backend logic)
  const computedPurpose = useMemo(() => {
    if (selectedObjIds.size === 0) return null;
    const selected = objectives.filter((o) => selectedObjIds.has(o.id));
    const allMastered = selected.every((o) => o.status === "mastered");
    const anyMastered = selected.some((o) => o.status === "mastered");
    if (allMastered) return "maintenance";
    if (anyMastered) return "mixed";
    return "intervention";
  }, [selectedObjIds, objectives]);

  const updateForm = (key: keyof FormData, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const validateStep1 = (): boolean => {
    if (!form.student_id) {
      toast.error("Vui lòng chọn học sinh");
      return false;
    }
    if (!form.session_date) {
      toast.error("Vui lòng chọn ngày");
      return false;
    }
    const today = new Date().toISOString().split("T")[0];
    if (form.session_date < today) {
      setPastDateModalVisible(true);
      return false;
    }
    const toFloat = (t: TimeValue) => t.hours + t.minutes / 60;
    if (toFloat(form.end_time) <= toFloat(form.start_time)) {
      toast.error("Giờ kết thúc phải sau giờ bắt đầu");
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
    if (selectedObjIds.size === 0) {
      setNoObjectivesModalVisible(true);
      return;
    }
    try {
      const toFloat = (t: TimeValue) => t.hours + t.minutes / 60;
      await createMutation.mutateAsync({
        student_id: form.student_id,
        session_date: form.session_date,
        start_time: toFloat(form.start_time),
        end_time: toFloat(form.end_time),
        session_type: form.session_type,
        objective_ids: [[6, 0, Array.from(selectedObjIds)]],
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSuccessModalVisible(true);
    } catch (e: any) {
      toast.error("Không thể tạo buổi học", e?.message);
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

          {/* Student picker trigger */}
          <View style={styles.fieldWrap}>
            <Text variant="labelMedium" style={{ marginBottom: 4 }}>
              Học sinh
            </Text>
            <TouchableOpacity
              onPress={() => setStudentPickerVisible(true)}
              style={[
                styles.studentTrigger,
                {
                  borderColor: form.student_id
                    ? theme.colors.primary
                    : theme.colors.outline,
                  backgroundColor: theme.colors.surface,
                },
              ]}
              activeOpacity={0.7}
            >
              {form.student_id ? (
                <View style={styles.studentTriggerSelected}>
                  <MaterialCommunityIcons
                    name="account-circle-outline"
                    size={18}
                    color={theme.colors.primary}
                  />
                  <Text
                    style={[
                      styles.studentTriggerText,
                      { color: theme.colors.onSurface },
                    ]}
                    numberOfLines={1}
                  >
                    {studentName}
                  </Text>
                </View>
              ) : (
                <Text
                  style={[
                    styles.studentTriggerText,
                    { color: theme.colors.outline },
                  ]}
                >
                  Chọn học sinh...
                </Text>
              )}
              <MaterialCommunityIcons
                name="chevron-down"
                size={20}
                color={
                  form.student_id ? theme.colors.primary : theme.colors.outline
                }
              />
            </TouchableOpacity>
          </View>
          <DatePickerField
            label="Ngày học"
            value={form.session_date}
            onChange={(v) => updateForm("session_date", v)}
            disablePast
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

          {/* Session purpose indicator
          {computedPurpose && (
            <View
              style={[
                styles.purposeChip,
                {
                  backgroundColor:
                    computedPurpose === "maintenance"
                      ? "#E8F5E9"
                      : computedPurpose === "mixed"
                        ? "#FFF3E0"
                        : "#E3F2FD",
                },
              ]}
            >
              <MaterialCommunityIcons
                name={
                  computedPurpose === "maintenance"
                    ? "check-decagram"
                    : computedPurpose === "mixed"
                      ? "swap-horizontal"
                      : "school-outline"
                }
                size={14}
                color={
                  computedPurpose === "maintenance"
                    ? "#2E7D32"
                    : computedPurpose === "mixed"
                      ? "#E65100"
                      : "#1565C0"
                }
              />
              <Text
                variant="labelSmall"
                style={{
                  marginLeft: 6,
                  fontWeight: "700",
                  color:
                    computedPurpose === "maintenance"
                      ? "#2E7D32"
                      : computedPurpose === "mixed"
                        ? "#E65100"
                        : "#1565C0",
                }}
              >
                Loại buổi:{" "}
                {computedPurpose === "maintenance"
                  ? "Duy trì"
                  : computedPurpose === "mixed"
                    ? "Can thiệp + Duy trì"
                    : "Can thiệp"}
              </Text>
            </View>
          )} */}

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
              {daySessions.map((s) => {
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

        {/* ── No objectives modal ──────────────────────────────────── */}
        <Modal
          visible={noObjectivesModalVisible}
          onDismiss={() => setNoObjectivesModalVisible(false)}
          contentContainerStyle={[
            styles.modal,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <View style={styles.modalContent}>
            <MaterialCommunityIcons
              name="checkbox-blank-off-outline"
              size={48}
              color="#E65100"
            />
            <Text
              variant="titleMedium"
              style={{
                fontWeight: "800",
                textAlign: "center",
                marginTop: 12,
                color: "#B71C1C",
              }}
            >
              Chưa chọn mục tiêu
            </Text>
            <Text
              variant="bodySmall"
              style={{
                color: theme.colors.onSurfaceVariant,
                textAlign: "center",
                marginTop: 8,
                lineHeight: 18,
              }}
            >
              Vui lòng chọn ít nhất một mục tiêu trước khi lưu buổi học.
            </Text>
            <Button
              mode="contained"
              buttonColor="#E65100"
              style={{ marginTop: 20, borderRadius: 10 }}
              contentStyle={{ paddingVertical: 4 }}
              onPress={() => setNoObjectivesModalVisible(false)}
            >
              Quay lại để chọn
            </Button>
          </View>
        </Modal>

        {/* ── Past date modal ─────────────────────────────────────── */}
        <Modal
          visible={pastDateModalVisible}
          onDismiss={() => setPastDateModalVisible(false)}
          contentContainerStyle={[
            styles.modal,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <View style={styles.conflictModalContent}>
            <View
              style={[styles.conflictIconWrap, { backgroundColor: "#FFF8E1" }]}
            >
              <MaterialCommunityIcons
                name="calendar-remove"
                size={40}
                color="#F57F17"
              />
            </View>
            <Text
              variant="titleMedium"
              style={{
                fontWeight: "800",
                textAlign: "center",
                marginTop: 12,
                color: "#E65100",
              }}
            >
              Không thể chọn ngày đã qua
            </Text>
            <Text
              variant="bodySmall"
              style={{
                color: theme.colors.onSurfaceVariant,
                textAlign: "center",
                marginTop: 8,
                lineHeight: 20,
              }}
            >
              Buổi học chỉ có thể được lên lịch từ{" "}
              <Text style={{ fontWeight: "700" }}>hôm nay trở đi</Text>.{"\n"}
              Vui lòng chọn lại ngày học.
            </Text>
            <Button
              mode="contained"
              buttonColor="#E65100"
              style={{ marginTop: 20, borderRadius: 10, width: "100%" }}
              contentStyle={{ paddingVertical: 4 }}
              onPress={() => setPastDateModalVisible(false)}
            >
              Chọn lại ngày
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

      <StudentPickerSheet
        visible={studentPickerVisible}
        students={students}
        selectedId={form.student_id}
        onSelect={(id) => updateForm("student_id", id)}
        onClose={() => setStudentPickerVisible(false)}
      />
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
  purposeChip: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  fieldWrap: { marginBottom: 16 },
  studentTrigger: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 48,
  },
  studentTriggerSelected: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  studentTriggerText: {
    flex: 1,
    fontSize: 14,
  },
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
