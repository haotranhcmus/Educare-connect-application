import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { AvatarLabel } from "../../../components/common/AvatarLabel";
import { StatusBadge } from "../../../components/common/StatusBadge";
import { LoadingOverlay } from "../../../components/common/LoadingOverlay";
import { ChildProfileTab } from "./ChildProfileTab";
import { ChildProgressTab } from "./ChildProgressTab";
import { useMyStudent } from "../../../hooks/useParent";

const TopTab = createMaterialTopTabNavigator();

export function ChildProfileScreen() {
  const theme = useTheme();
  const { data: student, isLoading } = useMyStudent();

  if (isLoading || !student) return <LoadingOverlay visible />;

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* Header — matches StudentDetailScreen style */}
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
  header: { alignItems: "center", paddingVertical: 16, paddingHorizontal: 16 },
  name: { fontWeight: "bold", marginTop: 8 },
  headerRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
});
