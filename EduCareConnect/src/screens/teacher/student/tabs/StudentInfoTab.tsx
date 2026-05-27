import React from "react";
import { ScrollView, View, StyleSheet } from "react-native";
import { Text, useTheme, Divider, Banner } from "react-native-paper";
import { SectionHeader } from "@components/common/SectionHeader";
import type { StudentDetail } from "@t";
import { formatDate } from "@utils/formatters";
import { DIAGNOSIS_LABELS, GENDER_LABELS } from "@utils/labels";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface Props {
  student: StudentDetail;
}

interface InfoItem {
  label: string;
  value?: string | number | boolean | null;
}

const LEARNING_STYLE_LABELS: Record<string, string> = {
  visual: "Trực quan",
  auditory: "Nghe",
  kinesthetic: "Vận động / Thực hành",
  mixed: "Kết hợp",
};

const COMMUNICATION_LEVEL_LABELS: Record<string, string> = {
  non_verbal: "Không ngôn ngữ",
  single_word: "Từ đơn",
  phrase: "Cụm từ",
  sentence: "Câu hoàn chỉnh",
  fluent: "Lưu loát",
};

const PARENT_RELATION_LABELS: Record<string, string> = {
  father: "Bố",
  mother: "Mẹ",
  guardian: "Người giám hộ",
};

const CONTACT_METHOD_LABELS: Record<string, string> = {
  phone: "Điện thoại",
  email: "Email",
  app: "Ứng dụng",
  zalo: "Zalo",
};

function getRefName(ref: unknown): string | undefined {
  if (!ref) return undefined;
  if (Array.isArray(ref)) return ref[1] as string;
  if (typeof ref === "object" && "name" in (ref as Record<string, unknown>)) {
    const name = (ref as { name?: string }).name;
    return name || undefined;
  }
  return undefined;
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

function InfoGrid({ items }: { items: InfoItem[] }) {
  const normalizedItems = items
    .map((item) => {
      if (
        item.value === undefined ||
        item.value === null ||
        item.value === false
      ) {
        return null;
      }
      const text = String(item.value).trim();
      if (!text || text.toLowerCase() === "false") return null;
      return { ...item, value: text };
    })
    .filter((item): item is { label: string; value: string } => item !== null);

  return (
    <View style={styles.infoGrid}>
      {normalizedItems.map((item) => (
        <InfoCell key={item.label} label={item.label} value={item.value} />
      ))}
    </View>
  );
}

export function StudentInfoTab({ student }: Props) {
  const theme = useTheme();
  const diagnosisName = student.primary_diagnosis
    ? DIAGNOSIS_LABELS[student.primary_diagnosis]
    : undefined;
  const teacherName = getRefName(student.assigned_teacher_id);
  const supervisorName = getRefName(student.supervisor_id);
  const genderLabel = student.gender
    ? GENDER_LABELS[student.gender]
    : undefined;
  const parentRelationLabel = student.parent_relation
    ? PARENT_RELATION_LABELS[student.parent_relation]
    : undefined;
  const contactMethodLabel = student.preferred_contact_method
    ? CONTACT_METHOD_LABELS[student.preferred_contact_method]
    : undefined;

  return (
    <ScrollView
      style={{
        backgroundColor: theme.colors.background,
      }}
    >
      {/* Medical Alert */}
      {student.medical_alert && (
        <Banner
          visible
          style={{
            backgroundColor: theme.colors.error,
            alignItems: "center",
            justifyContent: "center",
          }}
          icon={({ size }) => (
            <MaterialCommunityIcons
              name="alert"
              size={size}
              color={theme.colors.onError}
            />
          )}
        >
          <Text style={{ color: theme.colors.onError }}>
            {student.medical_alert_detail || "Có cảnh báo y tế"}
          </Text>
        </Banner>
      )}
      <View style={{ flex: 1, paddingHorizontal: 16 }}>
        <SectionHeader icon="account" title="Thông tin cơ bản" />
        <View style={styles.section}>
          <InfoGrid
            items={[
              { label: "Họ và tên", value: student.name },
              { label: "Mã học sinh", value: student.student_code },
              { label: "Ngày sinh", value: formatDate(student.date_of_birth) },
              {
                label: "Tuổi",
                value: student.age ? `${student.age} tuổi` : undefined,
              },
              { label: "Giới tính", value: genderLabel },
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
              { label: "Chẩn đoán chính", value: diagnosisName },
              {
                label: "Ngày chẩn đoán",
                value: formatDate(student.diagnosis_date),
              },
              { label: "Đơn vị chẩn đoán", value: student.diagnosed_by },
              {
                label: "Thuốc đang dùng",
                value: student.current_medications || "Không",
              },
            ]}
          />
        </View>
        <Divider />
        <SectionHeader icon="account-heart" title="Phụ huynh" />
        <View style={styles.section}>
          <InfoGrid
            items={[
              { label: "Phụ huynh chính", value: student.parent_name },
              { label: "Quan hệ", value: parentRelationLabel },
              { label: "Điện thoại", value: student.parent_phone },
              { label: "Email", value: student.parent_email },
              { label: "Liên lạc ưu tiên", value: contactMethodLabel },
            ]}
          />
        </View>
        <Divider />
        <SectionHeader icon="account-group" title="Đội ngũ can thiệp" />
        <View style={styles.section}>
          <InfoGrid
            items={[
              { label: "Giáo viên phụ trách", value: teacherName },
              { label: "Giám sát viên", value: supervisorName },
            ]}
          />
        </View>
        <Divider />
        {/* <SectionHeader icon="school" title="Học tập" />
        <View style={styles.section}>
          <InfoGrid
            items={[
              {
                label: "Phong cách học tập",
                value:
                  LEARNING_STYLE_LABELS[student.learning_style || ""] ||
                  student.learning_style,
              },
              {
                label: "Mức độ giao tiếp",
                value:
                  COMMUNICATION_LEVEL_LABELS[
                    student.communication_level || ""
                  ] || student.communication_level,
              },
              {
                label: "Thời gian tập trung",
                value: student.attention_span?.toString(),
              },
            ]}
          />
        </View> */}
      </View>
      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  section: { paddingBottom: 8 },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  infoCell: {
    width: "48.5%",
    marginBottom: 12,
  },
});
