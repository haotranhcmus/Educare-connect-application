import React, { useCallback } from "react";
import { View, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { AvatarLabel } from "../../../components/common/AvatarLabel";
import { StatusBadge } from "../../../components/common/StatusBadge";
import { LoadingOverlay } from "../../../components/common/LoadingOverlay";
import { EmptyState } from "../../../components/common/EmptyState";
import { useMyStudents } from "../../../hooks/useParent";
import { useParentStore } from "../../../store/parentStore";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { ParentChildStackParamList } from "../../../navigation/types";

type Props = NativeStackScreenProps<ParentChildStackParamList, "ChildList">;

const GENDER_LABELS: Record<string, string> = { male: "Nam", female: "Nữ" };

export function ChildListScreen({ navigation }: Props) {
  const theme = useTheme();
  const { data: students = [], isLoading } = useMyStudents();
  const { selectedStudentId, selectedStudent } = useParentStore();

  // If a child is already selected from home, skip the list and go directly
  useFocusEffect(
    useCallback(() => {
      if (selectedStudentId && selectedStudent) {
        navigation.replace("ChildDetail", {
          studentId: selectedStudentId,
          studentName: selectedStudent.name,
        });
      }
    }, [selectedStudentId, selectedStudent]),
  );

  // Show a loading overlay while redirecting to avoid list flash
  if (selectedStudentId) return <LoadingOverlay visible />;
  if (isLoading) return <LoadingOverlay visible />;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <FlatList
        data={students}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState
            icon="account-child-outline"
            title="Chưa có học sinh nào"
            description="Tài khoản này chưa được liên kết với học sinh nào."
          />
        }
        renderItem={({ item }) => {
          const teacherName = Array.isArray(item.assigned_teacher_id)
            ? item.assigned_teacher_id[1]
            : null;
          const centerName = Array.isArray(item.center_id)
            ? item.center_id[1]
            : null;

          return (
            <TouchableOpacity
              style={[styles.card, { backgroundColor: theme.colors.surface }]}
              activeOpacity={0.7}
              onPress={() =>
                navigation.navigate("ChildDetail", {
                  studentId: item.id,
                  studentName: item.name,
                })
              }
            >
              <View style={styles.cardMain}>
                <AvatarLabel
                  uri={
                    item.avatar
                      ? `data:image/png;base64,${item.avatar}`
                      : undefined
                  }
                  name={item.name}
                  size={56}
                />
                <View style={styles.cardInfo}>
                  <View style={styles.nameRow}>
                    <Text
                      variant="titleSmall"
                      style={styles.name}
                      numberOfLines={1}
                    >
                      {item.name}
                    </Text>
                    <StatusBadge status={item.status} />
                  </View>
                  <Text
                    variant="bodySmall"
                    style={{ color: theme.colors.outline }}
                  >
                    {item.student_code}
                    {item.age ? `  ·  ${item.age} tuổi` : ""}
                    {item.gender
                      ? `  ·  ${GENDER_LABELS[item.gender] ?? ""}`
                      : ""}
                  </Text>
                  {teacherName && (
                    <View style={styles.chipRow}>
                      <MaterialCommunityIcons
                        name="school-outline"
                        size={13}
                        color={theme.colors.outline}
                      />
                      <Text
                        variant="labelSmall"
                        style={{
                          color: theme.colors.outline,
                          marginLeft: 4,
                        }}
                        numberOfLines={1}
                      >
                        {teacherName}
                      </Text>
                    </View>
                  )}
                  {centerName && (
                    <View style={styles.chipRow}>
                      <MaterialCommunityIcons
                        name="domain"
                        size={13}
                        color={theme.colors.outline}
                      />
                      <Text
                        variant="labelSmall"
                        style={{
                          color: theme.colors.outline,
                          marginLeft: 4,
                        }}
                        numberOfLines={1}
                      >
                        {centerName}
                      </Text>
                    </View>
                  )}
                </View>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={22}
                  color={theme.colors.outline}
                />
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, paddingBottom: 40 },
  card: {
    borderRadius: 14,
    marginBottom: 12,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 3,
    overflow: "hidden",
  },
  cardMain: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  cardInfo: { flex: 1, minWidth: 0 },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  name: { fontWeight: "700", flex: 1 },
  chipRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 3,
  },
});
