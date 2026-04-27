import React, { useState } from "react";
import { View, ScrollView, StyleSheet, Alert } from "react-native";
import { Text, Button, useTheme } from "react-native-paper";
import { StepIndicator } from "../../../components/common/StepIndicator";
import { ObjectiveCard } from "../../../components/iep/ObjectiveCard";
import { LoadingOverlay } from "../../../components/common/LoadingOverlay";
import {
  useCreateSession,
  useStudentActiveObjectives,
} from "../../../hooks/useSessions";
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
  const { data: students = [] } = useStudentsWithActivePlan();
  const createMutation = useCreateSession();

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

  const handleNext = () => {
    if (validateStep1()) setStep(1);
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
      // Reset the session stack to SessionList to avoid leaving SessionCreate in history
      navigation.reset({ index: 0, routes: [{ name: "SessionList" }] });
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
});
