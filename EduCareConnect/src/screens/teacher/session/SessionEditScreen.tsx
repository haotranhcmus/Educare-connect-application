import React, { useState, useEffect } from "react";
import { View, ScrollView, StyleSheet, Alert } from "react-native";
import { Text, Button, useTheme } from "react-native-paper";
import { StatusBadge } from "../../../components/common/StatusBadge";
import { ObjectiveCard } from "../../../components/iep/ObjectiveCard";
import { LoadingOverlay } from "../../../components/common/LoadingOverlay";
import { Picker } from "../../../components/form/Picker";
import { DatePickerField } from "../../../components/form/DatePickerField";
import { TimePickerField } from "../../../components/form/TimePickerField";
import {
  useSessionDetail,
  useUpdateSession,
  useStudentActiveObjectives,
} from "../../../hooks/useSessions";
import {
  LOCATION_LABELS,
  SESSION_TYPE_LABELS,
  SESSION_PURPOSE_LABELS,
  toPickerOptions,
} from "../../../utils/labels";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { SessionStackParamList } from "../../../navigation/types";

type Props = NativeStackScreenProps<SessionStackParamList, "SessionEdit">;

const LOCATION_OPTIONS = toPickerOptions(LOCATION_LABELS);
const TYPE_OPTIONS = toPickerOptions(SESSION_TYPE_LABELS);
const PURPOSE_OPTIONS = toPickerOptions(SESSION_PURPOSE_LABELS);

function floatToTime(f: number) {
  const hours = Math.floor(f);
  const minutes = Math.round((f - hours) * 60);
  return { hours, minutes };
}

export function SessionEditScreen({ route, navigation }: Props) {
  const { sessionId } = route.params;
  const theme = useTheme();
  const { data: session, isLoading } = useSessionDetail(sessionId);
  const updateMutation = useUpdateSession();

  const [form, setForm] = useState({
    session_date: "",
    start_time: { hours: 8, minutes: 0 },
    end_time: { hours: 9, minutes: 0 },
    location: "",
    session_type: "",
    session_purpose: "",
  });

  const studentId = Array.isArray(session?.student_id)
    ? session.student_id[0]
    : 0;
  const { data: objectives = [] } = useStudentActiveObjectives(studentId);
  const [selectedObjIds, setSelectedObjIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (session) {
      setForm({
        session_date: session.session_date || "",
        start_time: floatToTime(session.start_time || 8),
        end_time: floatToTime(session.end_time || 9),
        location: session.location || "center",
        session_type: session.session_type || "individual",
        session_purpose: session.session_purpose || "intervention",
      });
      if (session.objective_ids) {
        setSelectedObjIds(new Set(session.objective_ids));
      }
    }
  }, [session]);

  const updateField = (key: string, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const toggleObj = (id: number) => {
    setSelectedObjIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSave = async () => {
    try {
      const toFloat = (t: { hours: number; minutes: number }) =>
        t.hours + t.minutes / 60;
      await updateMutation.mutateAsync({
        sessionId,
        vals: {
          session_date: form.session_date,
          start_time: toFloat(form.start_time),
          end_time: toFloat(form.end_time),
          location: form.location,
          session_type: form.session_type,
          session_purpose: form.session_purpose,
          objective_ids: [[6, 0, Array.from(selectedObjIds)]],
        },
      });
      navigation.goBack();
    } catch (e: any) {
      Alert.alert("Lỗi", e.message || "Không thể cập nhật");
    }
  };

  if (isLoading) return <LoadingOverlay visible />;
  if (!session) return null;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.content}
    >
      <View style={styles.headerRow}>
        <Text variant="titleSmall">{session.name}</Text>
        <StatusBadge status={session.status} />
      </View>

      <DatePickerField
        label="Ngày học"
        value={form.session_date}
        onChange={(v) => updateField("session_date", v)}
      />
      <View style={styles.timeRow}>
        <TimePickerField
          label="Bắt đầu"
          value={form.start_time}
          onChange={(v) => updateField("start_time", v)}
        />
        <TimePickerField
          label="Kết thúc"
          value={form.end_time}
          onChange={(v) => updateField("end_time", v)}
        />
      </View>
      <Picker
        label="Địa điểm"
        value={form.location}
        options={LOCATION_OPTIONS}
        onChange={(v) => updateField("location", v)}
      />
      <Picker
        label="Loại buổi học"
        value={form.session_type}
        options={TYPE_OPTIONS}
        onChange={(v) => updateField("session_type", v)}
      />
      <Picker
        label="Mục đích"
        value={form.session_purpose}
        options={PURPOSE_OPTIONS}
        onChange={(v) => updateField("session_purpose", v)}
      />

      <Text
        variant="titleSmall"
        style={{ marginTop: 16, marginBottom: 8, fontWeight: "700" }}
      >
        Mục Tiêu
      </Text>
      {objectives.map((obj) => (
        <ObjectiveCard
          key={obj.id}
          objective={obj}
          selectable
          selected={selectedObjIds.has(obj.id)}
          onSelect={toggleObj}
        />
      ))}

      <View style={styles.btnRow}>
        <Button mode="outlined" onPress={() => navigation.goBack()}>
          Hủy
        </Button>
        <Button
          mode="contained"
          onPress={handleSave}
          loading={updateMutation.isPending}
        >
          Lưu
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 32 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  timeRow: { flexDirection: "row", gap: 12 },
  btnRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 24,
  },
});
