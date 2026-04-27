import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { StudentStackParamList } from "../../../navigation/types";
import { useStudentDetail } from "../../../hooks/useStudents";
import { AvatarLabel } from "../../../components/common/AvatarLabel";
import { StatusBadge } from "../../../components/common/StatusBadge";
import { LoadingOverlay } from "../../../components/common/LoadingOverlay";
import { StudentInfoTab } from "./tabs/StudentInfoTab";
import { StudentIepTab } from "./tabs/StudentIepTab";
import { StudentSessionTab } from "./tabs/StudentSessionTab";
import { StudentReportTab } from "./tabs/StudentReportTab";

type Props = NativeStackScreenProps<StudentStackParamList, "StudentDetail">;
const TopTab = createMaterialTopTabNavigator();

export function StudentDetailScreen({ route, navigation }: Props) {
  const { studentId } = route.params;
  const theme = useTheme();
  const { data: student, isLoading } = useStudentDetail(studentId);

  if (isLoading) {
    return <LoadingOverlay visible />;
  }

  if (!student) {
    return (
      <View
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
          Không tìm thấy học sinh
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* Header Card */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <AvatarLabel uri={student.avatar_url} name={student.name} size={64} />
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
        <TopTab.Screen name="Thông tin">
          {() => <StudentInfoTab student={student} />}
        </TopTab.Screen>
        <TopTab.Screen name="IEP">
          {() => (
            <StudentIepTab studentId={student.id} navigation={navigation} />
          )}
        </TopTab.Screen>
        <TopTab.Screen name="Buổi học">
          {() => (
            <StudentSessionTab studentId={student.id} navigation={navigation} />
          )}
        </TopTab.Screen>
        <TopTab.Screen name="Báo cáo">
          {() => (
            <StudentReportTab studentId={student.id} navigation={navigation} />
          )}
        </TopTab.Screen>
      </TopTab.Navigator>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { alignItems: "center", paddingVertical: 16, paddingHorizontal: 16 },
  name: { fontWeight: "bold", marginTop: 8 },
  headerRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
});
