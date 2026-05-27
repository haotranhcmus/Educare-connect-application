import React from "react";
import { View, StyleSheet } from "react-native";
import Animated from "react-native-reanimated";
import { Text, Divider, useTheme } from "react-native-paper";
import { SectionHeader } from "@components/common/SectionHeader";
import { AvatarLabel } from "@components/common/AvatarLabel";
import { formatDate } from "@utils/formatters";
import { GENDER_LABELS, DIAGNOSIS_LABELS } from "@utils/labels";

interface ChildProfileTabProps {
  student: any;
  contentInsetTop?: number;
}

function InfoCell({ label, value }: { label: string; value?: string | null }) {
  const theme = useTheme();
  if (!value) return null;
  return (
    <View style={styles.infoCell}>
      <Text variant="labelSmall" style={{ color: theme.colors.outline }}>
        {label}
      </Text>
      <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
        {value}
      </Text>
    </View>
  );
}

function InfoGrid({
  items,
}: {
  items: { label: string; value?: string | null }[];
}) {
  const visible = items.filter(
    (i) => i.value !== undefined && i.value !== null && i.value !== "",
  );
  if (visible.length === 0) return null;
  return (
    <View style={styles.infoGrid}>
      {visible.map((i) => (
        <InfoCell key={i.label} label={i.label} value={i.value} />
      ))}
    </View>
  );
}

export function ChildProfileTab({
  student,
  contentInsetTop = 0,
}: ChildProfileTabProps) {
  const theme = useTheme();
  if (!student) return null;

  const teacherName = Array.isArray(student.assigned_teacher_id)
    ? student.assigned_teacher_id[1]
    : undefined;
  const supervisorName = Array.isArray(student.supervisor_id)
    ? student.supervisor_id[1]
    : undefined;
  const centerName = Array.isArray(student.center_id)
    ? student.center_id[1]
    : undefined;

  // Guard against the "—" placeholder formatDate returns for falsy input
  // so we don't render an empty-age cell.
  const dobStr = student.date_of_birth ? formatDate(student.date_of_birth) : "";
  const dobWithAge = dobStr
    ? `${dobStr}${student.age ? `  (${student.age} tuổi)` : ""}`
    : undefined;

  return (
    <Animated.ScrollView
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={{ paddingTop: contentInsetTop }}
    >
      <View style={{ paddingHorizontal: 12 }}>
        <SectionHeader icon="account" title="Thông tin cơ bản" />
      </View>
      <View style={styles.section}>
        <InfoGrid
          items={[
            { label: "Họ và tên", value: student.name },
            { label: "Mã học sinh", value: student.student_code },
            { label: "Ngày sinh", value: dobWithAge },
            { label: "Giới tính", value: GENDER_LABELS[student.gender] },
            { label: "Trường học", value: student.school_name },
            { label: "Lớp", value: student.class_name },
            {
              label: "Ngày bắt đầu can thiệp",
              value: formatDate(student.enrollment_date),
            },
            {
              label: "Trung tâm can thiệp",
              value: centerName,
            },
          ]}
        />
      </View>

      <Divider />

      <View style={{ paddingHorizontal: 12 }}>
        <SectionHeader icon="clipboard-list" title="Chẩn đoán" />
      </View>
      <View style={styles.section}>
        <InfoGrid
          items={[
            {
              label: "Chẩn đoán chính",
              value: DIAGNOSIS_LABELS[student.primary_diagnosis],
            },
            { label: "Chẩn đoán phụ", value: student.secondary_diagnosis },
          ]}
        />
      </View>

      <Divider />

      <View style={{ paddingHorizontal: 12 }}>
        <SectionHeader icon="account-group" title="Đội ngũ can thiệp" />
      </View>
      <View style={styles.section}>
        <InfoGrid
          items={[
            { label: "Giáo viên phụ trách", value: teacherName },
            { label: "Giám sát viên", value: supervisorName },
          ]}
        />
      </View>

      <View style={{ height: 40 }} />
    </Animated.ScrollView>
  );
}

const styles = StyleSheet.create({
  section: { paddingHorizontal: 16, paddingBottom: 8 },
  infoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
  infoCell: { minWidth: "45%", flex: 1 },
  teamRow: { marginBottom: 16 },
});
