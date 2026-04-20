import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { AvatarLabel } from "../common/AvatarLabel";
import { StatusBadge } from "../common/StatusBadge";
import type { StudentListItem } from "../../types";

interface StudentListCardProps {
  student: StudentListItem;
  onPress: (studentId: number) => void;
  showIepBadge?: boolean;
}

export function StudentListCard({
  student,
  onPress,
  showIepBadge = true,
}: StudentListCardProps) {
  const theme = useTheme();
  const diagnosisName = Array.isArray(student.primary_diagnosis)
    ? student.primary_diagnosis[1]
    : undefined;

  return (
    <TouchableOpacity onPress={() => onPress(student.id)} activeOpacity={0.7}>
      <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <AvatarLabel name={student.name} size={44} />
        <View style={styles.content}>
          <Text
            variant="titleSmall"
            style={{ color: theme.colors.onSurface }}
            numberOfLines={1}
          >
            {student.name}
          </Text>
          <Text
            variant="bodySmall"
            style={{ color: theme.colors.onSurfaceVariant }}
          >
            {student.student_code}
          </Text>
          <View style={styles.row}>
            {diagnosisName && (
              <Text
                variant="labelSmall"
                style={{ color: theme.colors.outline }}
              >
                {diagnosisName}
              </Text>
            )}
            {diagnosisName && (
              <Text style={{ color: theme.colors.outline }}> · </Text>
            )}
            <StatusBadge status={student.status} size="small" />
          </View>
          {showIepBadge && student.latest_iep_status && (
            <View style={styles.iepRow}>
              <Text
                variant="labelSmall"
                style={{ color: theme.colors.outline }}
              >
                IEP:
              </Text>
              <StatusBadge
                status={student.latest_iep_status}
                size="small"
                label={student.latest_iep_period}
              />
            </View>
          )}
        </View>
        <MaterialCommunityIcons
          name="chevron-right"
          size={24}
          color={theme.colors.outline}
        />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    elevation: 1,
  },
  content: {
    flex: 1,
    marginLeft: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  iepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
});