import React, { useState, useEffect } from "react";
import { View, ScrollView, StyleSheet, Alert } from "react-native";
import { Text, Button, useTheme, Modal, Portal } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StepIndicator } from "../../../components/common/StepIndicator";
import { ObjectiveCard } from "../../../components/iep/ObjectiveCard";
import { LoadingOverlay } from "../../../components/common/LoadingOverlay";
import {
  useCreateSession,
  useStudentActiveObjectives,
} from "../../../hooks/useSessions";
import { checkStudentSessionConflict } from "../../../api/sessionApi";
import { formatFloatTime } from "../../../utils/formatters";
import { useStudentsWithActivePlan } from "../../../hooks/useStudents";
import { Picker } from "../../../components/form/Picker";
import { DatePickerField } from "../../../components/form/DatePickerField";
import {
  TimePickerField,
  type TimeValue,
} from "../../../components/form/TimePickerField";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { SessionStackParamList } from "../../../navigation/types";

type Props = NativeStackScreenProps<SessionStackParamList, "SessionCreate">;

const STEPS = ["Thông tin", "Mục tiêu & Xác nhận"];

const LOCATION_OPTIONS = [
  { value: "center", label: "Tại trung tâm" },
  { value: "home", label: "Tại nhà" },
  { value: "school", label: "Tại trường" },
  { value: "online", label: "Online" },
];

const TYPE_OPTIONS = [
  { value: "individual", label: "1:1 Cá nhân" },
  { value: "small_group", label: "Nhóm nhỏ" },
  { value: "consultation", label: "Tư vấn" },
];

const PURPOSE_OPTIONS = [
  { value: "intervention", label: "Can thiệp" },
  { value: "maintenance_probe", label: "Đánh giá duy trì" },
  { value: "generalization_probe", label: "Đánh giá tổng quát hóa" },
  { value: "parent_training", label: "Hướng dẫn phụ huynh" },
];

interface FormData {
  student_id: number;
  session_date: string;
  start_time: TimeValue;
  end_time: TimeValue;
  location: string;
  session_type: string;
  session_purpose: string;
}

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

  // Form state — pre-fill studentId if passed from Home/StudentDetail
  const [form, setForm] = useState<FormData>({
    student_id: route.params?.studentId ?? 0,
    session_date: new Date().toISOString().split("T")[0],
    start_time: { hours: 8, minutes: 0 },
    end_time: { hours: 9, minutes: 0 },
    location: "center",
    session_type: "individual",
    session_purpose: "intervention",
  });

  // Step 2: objectives
  const { data: objectives = [], isLoading: objLoading } =
    useStudentActiveObjectives(step === 1 ? form.student_id : 0);
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
    return true;
  };

  const handleNext = async () => {
    if (!validateStep1()) return;
    try {
      const toFloat = (t: TimeValue) => t.hours + t.minutes / 60;
      const newStart = toFloat(form.start_time);
      const newEnd = toFloat(form.end_time);

      const conflicts = await checkStudentSessionConflict(
        form.student_id,
        form.session_date,
      );

      if (conflicts.length > 0) {
        // Check if any existing session truly overlaps (times overlap)
        const overlapping = conflicts.filter(
          (c) =>
            Math.max(c.start_time, newStart) < Math.min(c.end_time, newEnd),
        );

        if (overlapping.length > 0) {
          // Hard block — time overlap, hide "continue"
          const detail = overlapping
            .map(
              (c) =>
                `• ${formatFloatTime(c.start_time)} – ${formatFloatTime(c.end_time)}`,
            )
            .join("\n");
          Alert.alert(
            "Trùng giờ học",
            `Học sinh đã có buổi học trùng giờ vào ngày ${form.session_date}:\n${detail}\n\nVui lòng chọn giờ khác hoặc ngày khác.`,
            [{ text: "Quay lại", style: "cancel" }],
          );
          return;
        }

        // Same day, non-overlapping — warn but allow continue
        const detail = conflicts
          .map(
            (c) =>
              `• ${formatFloatTime(c.start_time)} – ${formatFloatTime(c.end_time)}`,
          )
          .join("\n");
        Alert.alert(
          "Cùng ngày học",
          `Học sinh đã có ${conflicts.length} buổi học vào ngày ${form.session_date}:\n${detail}\n\nBạn có muốn tiếp tục tạo thêm buổi học không?`,
          [
            { text: "Quay lại", style: "cancel" },
            { text: "Tiếp tục", onPress: () => setStep(1) },
          ],
        );
      } else {
        setStep(1);
      }
    } catch {
      setStep(1);
    }
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
      // Convert { hours, minutes } → Odoo float time (e.g. 8:30 → 8.5)
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

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StepIndicator steps={STEPS} currentStep={step} />

      {step === 0 && (
        <ScrollView contentContainerStyle={styles.content}>
          <Text
            variant="titleSmall"
            style={{ fontWeight: "700", marginBottom: 16 }}
          >
            Bước 1: Thông Tin Cơ Bản
          </Text>

          <Picker
            label="Học sinh *"
            value={form.student_id}
            options={students.map((s) => ({
              value: s.id,
              label: s.name || "",
            }))}
            onChange={(v) => updateForm("student_id", v)}
          />

          <DatePickerField
            label="Ngày học *"
            value={form.session_date}
            onChange={(v) => updateForm("session_date", v)}
          />

          <View style={styles.timeRow}>
            <TimePickerField
              label="Bắt đầu"
              value={form.start_time}
              onChange={(v: TimeValue) => updateForm("start_time", v)}
            />
            <TimePickerField
              label="Kết thúc"
              value={form.end_time}
              onChange={(v: TimeValue) => updateForm("end_time", v)}
            />
          </View>

          <Picker
            label="Địa điểm *"
            value={form.location}
            options={LOCATION_OPTIONS}
            onChange={(v) => updateForm("location", v)}
          />
          <Picker
            label="Loại buổi học *"
            value={form.session_type}
            options={TYPE_OPTIONS}
            onChange={(v) => updateForm("session_type", v)}
          />
          <Picker
            label="Mục đích *"
            value={form.session_purpose}
            options={PURPOSE_OPTIONS}
            onChange={(v) => updateForm("session_purpose", v)}
          />

          <Button mode="contained" onPress={handleNext} style={styles.btn}>
            Tiếp theo →
          </Button>
        </ScrollView>
      )}

      {step === 1 && (
        <ScrollView contentContainerStyle={styles.content}>
          <Text
            variant="titleSmall"
            style={{ fontWeight: "700", marginBottom: 8 }}
          >
            Bước 2: Chọn Mục Tiêu
          </Text>
          <Text
            variant="bodySmall"
            style={{ color: theme.colors.outline, marginBottom: 16 }}
          >
            Học sinh: {studentName}
          </Text>

          {objLoading ? (
            <LoadingOverlay visible />
          ) : (
            objectives.map((obj) => (
              <ObjectiveCard
                key={obj.id}
                objective={obj}
                selectable
                selected={selectedObjIds.has(obj.id)}
                onSelect={toggleObjective}
              />
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
  modal: {
    marginHorizontal: 32,
    borderRadius: 20,
    overflow: "hidden",
  },
  modalContent: {
    padding: 32,
    alignItems: "center",
  },
});
