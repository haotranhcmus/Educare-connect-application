import React from "react";
import { ScrollView, View, StyleSheet } from "react-native";
import { Text, Divider, useTheme } from "react-native-paper";
import { SectionHeader } from "@components/common/SectionHeader";
import { AvatarLabel } from "@components/common/AvatarLabel";
import { formatDate } from "@utils/formatters";
import { GENDER_LABELS } from "@utils/labels";

interface ChildProfileTabProps {
  student: any;
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

export function ChildProfileTab({ student }: ChildProfileTabProps) {
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
  const dobStr = student.date_of_birth
    ? formatDate(student.date_of_birth)
    : "";
  const dobWithAge = dobStr
    ? `${dobStr}${student.age ? `  (${student.age} tuổi)` : ""}`
    : undefined;

  return (
    <ScrollView style={{ backgroundColor: theme.colors.background }}>
      <SectionHeader icon="account" title="Thông tin cơ bản" />
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
          ]}
        />
      </View>

      <Divider />

      <SectionHeader icon="medical-bag" title="Chẩn đoán" />
      <View style={styles.section}>
        <InfoGrid
          items={[
            { label: "Chẩn đoán chính", value: student.primary_diagnosis },
            { label: "Chẩn đoán phụ", value: student.secondary_diagnosis },
          ]}
        />
      </View>

      <Divider />

      <SectionHeader icon="account-group" title="Đội ngũ can thiệp" />
      <View style={styles.section}>
        {teacherName && (
          <View style={styles.teamRow}>
            <Text
              variant="labelSmall"
              style={{ color: theme.colors.outline, marginBottom: 4 }}
            >
              Giáo viên phụ trách
            </Text>
            <AvatarLabel name={teacherName} size={32} />
          </View>
        )}
        <InfoGrid
          items={[
            { label: "Supervisor / BCBA", value: supervisorName },
            { label: "Trung tâm", value: centerName },
          ]}
        />
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  section: { paddingHorizontal: 16, paddingBottom: 8 },
  infoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
  infoCell: { minWidth: "45%", flex: 1 },
  teamRow: { marginBottom: 16 },
});
