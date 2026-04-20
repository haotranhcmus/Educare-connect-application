import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTheme } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type {
  TeacherTabParamList,
  StudentStackParamList,
  SessionStackParamList,
  ReportStackParamList,
  ProfileStackParamList,
} from "./types";

// Placeholder screens — sẽ replace trong Week 3-7
import { PlaceholderScreen } from "../screens/PlaceholderScreen";

const Tab = createBottomTabNavigator<TeacherTabParamList>();
const StudentStack = createNativeStackNavigator<StudentStackParamList>();
const SessionStack = createNativeStackNavigator<SessionStackParamList>();
const ReportStack = createNativeStackNavigator<ReportStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

// --- Stack Navigators ---

function StudentStackNavigator() {
  return (
    <StudentStack.Navigator screenOptions={{ headerShown: true }}>
      <StudentStack.Screen
        name="StudentList"
        component={PlaceholderScreen}
        options={{ title: "Học sinh" }}
      />
      <StudentStack.Screen
        name="StudentDetail"
        component={PlaceholderScreen}
        options={({ route }) => ({ title: "Chi tiết học sinh" })}
      />
      <StudentStack.Screen
        name="IepPlanDetail"
        component={PlaceholderScreen}
        options={({ route }) => ({
          title: route.params?.studentName || "Kế hoạch IEP",
        })}
      />
      <StudentStack.Screen
        name="IepObjectiveDetail"
        component={PlaceholderScreen}
        options={({ route }) => ({
          title: route.params?.objectiveName || "Chi tiết mục tiêu",
        })}
      />
    </StudentStack.Navigator>
  );
}

function SessionStackNavigator() {
  return (
    <SessionStack.Navigator screenOptions={{ headerShown: true }}>
      <SessionStack.Screen
        name="SessionList"
        component={PlaceholderScreen}
        options={{ title: "Buổi học" }}
      />
      <SessionStack.Screen
        name="SessionCreate"
        component={PlaceholderScreen}
        options={{ title: "Tạo buổi học" }}
      />
      <SessionStack.Screen
        name="SessionDetail"
        component={PlaceholderScreen}
        options={{ title: "Chi tiết buổi học" }}
      />
      <SessionStack.Screen
        name="SessionEdit"
        component={PlaceholderScreen}
        options={{ title: "Sửa buổi học" }}
      />
      <SessionStack.Screen
        name="EvalStep1"
        component={PlaceholderScreen}
        options={{ title: "Nhập kết quả", headerBackTitle: "Hủy" }}
      />
      <SessionStack.Screen
        name="EvalStep2"
        component={PlaceholderScreen}
        options={{ title: "Quan sát chung" }}
      />
      <SessionStack.Screen
        name="EvalStep3"
        component={PlaceholderScreen}
        options={{ title: "Xác nhận & Hoàn thành" }}
      />
    </SessionStack.Navigator>
  );
}

function ReportStackNavigator() {
  return (
    <ReportStack.Navigator screenOptions={{ headerShown: true }}>
      <ReportStack.Screen
        name="ReportList"
        component={PlaceholderScreen}
        options={{ title: "Báo cáo" }}
      />
      <ReportStack.Screen
        name="ReportCreate"
        component={PlaceholderScreen}
        options={{ title: "Tạo báo cáo" }}
      />
      <ReportStack.Screen
        name="ReportDetail"
        component={PlaceholderScreen}
        options={{ title: "Chi tiết báo cáo" }}
      />
    </ReportStack.Navigator>
  );
}

function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: true }}>
      <ProfileStack.Screen
        name="Profile"
        component={PlaceholderScreen}
        options={{ title: "Cá nhân" }}
      />
      <ProfileStack.Screen
        name="ChangePassword"
        component={PlaceholderScreen}
        options={{ title: "Đổi mật khẩu" }}
      />
    </ProfileStack.Navigator>
  );
}

// --- Main Tab Navigator ---

export function TeacherNavigator() {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false, // headers managed by stack navigators
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.outline,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.outlineVariant,
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={PlaceholderScreen}
        options={{
          title: "Trang chủ",
          headerShown: true,
          headerTitle: "Educare Connect",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="StudentTab"
        component={StudentStackNavigator}
        options={{
          title: "Học sinh",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="account-group"
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="SessionTab"
        component={SessionStackNavigator}
        options={{
          title: "Buổi học",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="calendar-check"
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="ReportTab"
        component={ReportStackNavigator}
        options={{
          title: "Báo cáo",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="file-document"
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStackNavigator}
        options={{
          title: "Cá nhân",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="account-circle"
              size={size}
              color={color}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}