import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { AvatarLabel } from "../../../components/common/AvatarLabel";
import { StatusBadge } from "../../../components/common/StatusBadge";
import { LoadingOverlay } from "../../../components/common/LoadingOverlay";
import { ChildProfileTab } from "./ChildProfileTab";
import { ChildProgressTab } from "./ChildProgressTab";
import { useStudentById } from "../../../hooks/useParent";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

const TopTab = createMaterialTopTabNavigator();

type ChildListStackParamList = {
  ChildList: undefined;
  ChildDetail: { studentId: number; studentName?: string };
  ChildIepHistory: { studentId: number; studentName?: string };
  ChildTimetable: { studentId: number; studentName?: string };
};
type Props = NativeStackScreenProps<ChildListStackParamList, "ChildDetail">;

export function ChildProfileScreen({ route, navigation }: Props) {
  const theme = useTheme();
  const { studentId } = route.params;
  const { data: student, isLoading } = useStudentById(studentId);

  if (isLoading || !student) return <LoadingOverlay visible />;

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <AvatarLabel
          uri={
            student.avatar
              ? `data:image/png;base64,${student.avatar}`
              : undefined
          }
          name={student.name}
          size={64}
        />
        <Text
          variant="titleLarge"
          style={[styles.name, { color: theme.colors.onSurface }]}
        >
          {student.name}
        </Text>
        <View style={styles.headerRow}>
          <Text
            variant="bodySmall"
            style={{ color: theme.colors.onSurfaceVariant }}
          >
            {student.student_code}
          </Text>
          <Text style={{ color: theme.colors.outline }}> · </Text>
          <StatusBadge status={student.status} />
        </View>
      </View>

      {/* Top Tabs */}
      <TopTab.Navigator
        screenOptions={{
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: "600",
            textTransform: "none",
          },
          tabBarIndicatorStyle: { backgroundColor: theme.colors.primary },
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.outline,
          tabBarStyle: { backgroundColor: theme.colors.surface },
        }}
      >
        <TopTab.Screen name="Hồ sơ">
          {() => <ChildProfileTab student={student} />}
        </TopTab.Screen>
        <TopTab.Screen name="Tiến độ IEP">
          {() => <ChildProgressTab studentId={student.id} />}
        </TopTab.Screen>
      </TopTab.Navigator>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    alignItems: "center",
    paddingTop: 16,
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  name: { fontWeight: "bold", marginTop: 8 },
  headerRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
});
