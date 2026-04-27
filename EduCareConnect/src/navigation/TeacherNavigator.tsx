import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StackActions } from "@react-navigation/native";
import { useTheme } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type {
  TeacherTabParamList,
  TeacherRootStackParamList,
  StudentStackParamList,
  SessionStackParamList,
  ReportStackParamList,
  ProfileStackParamList,
} from "./types";

// Placeholder screens — sẽ replace trong Week 3-7
import { PlaceholderScreen } from "../screens/PlaceholderScreen";
import { StudentListScreen } from "../screens/teacher/student/StudentListScreen";
import { StudentDetailScreen } from "../screens/teacher/student/StudentDetailScreen";
import { HomeScreen } from "../screens/teacher/HomeScreen";
import { IepPlanDetailScreen } from "../screens/teacher/iep/IepPlanDetailScreen";
import { IepObjectiveDetailScreen } from "../screens/teacher/iep/IepObjectiveDetailScreen";
import { SessionListScreen } from "../screens/teacher/session/SessionListScreen";
import { SessionCreateScreen } from "../screens/teacher/session/SessionCreateScreen";
import { SessionDetailScreen } from "../screens/teacher/session/SessionDetailScreen";
import { SessionEditScreen } from "../screens/teacher/session/SessionEditScreen";
import { EvalStep1Screen } from "../screens/teacher/session/EvalStep1Screen";
import { EvalStep2Screen } from "../screens/teacher/session/EvalStep2Screen";
import { EvalStep3Screen } from "../screens/teacher/session/EvalStep3Screen";
import { EvalDetailViewScreen } from "../screens/teacher/session/EvalDetailViewScreen";
import { ReportListScreen } from "../screens/teacher/report/ReportListScreen";
import { TeacherProfileScreen } from "../screens/teacher/profile/TeacherProfileScreen";
import { ReportCreateScreen } from "../screens/teacher/report/ReportCreateScreen";
import { ReportDetailScreen } from "../screens/teacher/report/ReportDetailScreen";
import { SessionPickerScreen } from "../screens/teacher/report/SessionPickerScreen";
import { ChangePasswordScreen } from "../screens/teacher/profile/ChangePasswordScreen";

const Tab = createBottomTabNavigator<TeacherTabParamList>();
const TeacherRootStack =
  createNativeStackNavigator<TeacherRootStackParamList>();
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
        component={StudentListScreen}
        options={{ title: "Học sinh" }}
      />
      <StudentStack.Screen
        name="StudentDetail"
        component={StudentDetailScreen}
        options={({ route }) => ({ title: "Chi tiết học sinh" })}
      />
      <StudentStack.Screen
        name="IepPlanDetail"
        component={IepPlanDetailScreen}
        options={({ route }) => ({
          title: route.params?.studentName || "Kế hoạch IEP",
        })}
      />
      <StudentStack.Screen
        name="IepObjectiveDetail"
        component={IepObjectiveDetailScreen}
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
        component={SessionListScreen}
        options={{ title: "Buổi học" }}
      />
      <SessionStack.Screen
        name="SessionCreate"
        component={SessionCreateScreen}
        options={{ title: "Tạo buổi học" }}
      />
      <SessionStack.Screen
        name="SessionDetail"
        component={SessionDetailScreen}
        options={{ title: "Chi tiết buổi học" }}
      />
      <SessionStack.Screen
        name="SessionEdit"
        component={SessionEditScreen}
        options={{ title: "Sửa buổi học" }}
      />
      <SessionStack.Screen
        name="EvalStep1"
        component={EvalStep1Screen}
        options={{ title: "Quan sát chung", headerBackTitle: "Hủy" }}
      />
      <SessionStack.Screen
        name="EvalStep2"
        component={EvalStep2Screen}
        options={{ title: "Đánh giá mục tiêu" }}
      />
      <SessionStack.Screen
        name="EvalStep3"
        component={EvalStep3Screen}
        options={{ title: "Xác nhận & Hoàn thành" }}
      />
      <SessionStack.Screen
        name="EvalDetailView"
        component={EvalDetailViewScreen}
        options={{ title: "Chi tiết đánh giá" }}
      />
    </SessionStack.Navigator>
  );
}

function ReportStackNavigator() {
  return (
    <ReportStack.Navigator screenOptions={{ headerShown: true }}>
      <ReportStack.Screen
        name="ReportList"
        component={ReportListScreen}
        options={{ title: "Báo cáo" }}
      />
      <ReportStack.Screen
        name="SessionPicker"
        component={SessionPickerScreen}
        options={{ title: "Chọn buổi học" }}
      />
      <ReportStack.Screen
        name="ReportCreate"
        component={ReportCreateScreen}
        options={{ title: "Tạo báo cáo" }}
      />
      <ReportStack.Screen
        name="ReportDetail"
        component={ReportDetailScreen}
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
        component={TeacherProfileScreen}
        options={{ title: "Cá nhân" }}
      />
      <ProfileStack.Screen
        name="ChangePassword"
        component={ChangePasswordScreen}
        options={{ title: "Đổi mật khẩu" }}
      />
    </ProfileStack.Navigator>
  );
}

// --- Main Tab Navigator ---

function TeacherTabsNavigator() {
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
        component={HomeScreen}
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
        listeners={({ navigation, route }) => ({
          tabPress: (e) => {
            const r = route as any;
            if (r.state && r.state.index > 0) {
              e.preventDefault();
              navigation.dispatch({
                ...StackActions.popToTop(),
                target: r.state.key,
              });
              navigation.navigate(route.name as any);
            }
          },
        })}
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
        listeners={({ navigation, route }) => ({
          tabPress: (e) => {
            const r = route as any;
            if (r.state && r.state.index > 0) {
              e.preventDefault();
              navigation.dispatch({
                ...StackActions.popToTop(),
                target: r.state.key,
              });
              navigation.navigate(route.name as any);
            }
          },
        })}
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
        listeners={({ navigation, route }) => ({
          tabPress: (e) => {
            const r = route as any;
            if (r.state && r.state.index > 0) {
              e.preventDefault();
              navigation.dispatch({
                ...StackActions.popToTop(),
                target: r.state.key,
              });
              navigation.navigate(route.name as any);
            }
          },
        })}
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
        listeners={({ navigation, route }) => ({
          tabPress: (e) => {
            const r = route as any;
            if (r.state && r.state.index > 0) {
              e.preventDefault();
              navigation.dispatch({
                ...StackActions.popToTop(),
                target: r.state.key,
              });
              navigation.navigate(route.name as any);
            }
          },
        })}
      />
    </Tab.Navigator>
  );
}

export function TeacherNavigator() {
  return (
    <TeacherRootStack.Navigator screenOptions={{ headerShown: true }}>
      <TeacherRootStack.Screen
        name="TeacherTabs"
        component={TeacherTabsNavigator}
        options={{ headerShown: false }}
      />
      <TeacherRootStack.Screen
        name="StudentDetail"
        component={StudentDetailScreen}
        options={{ title: "Chi tiết học sinh" }}
      />
      <TeacherRootStack.Screen
        name="IepPlanDetail"
        component={IepPlanDetailScreen}
        options={({ route }) => ({
          title: route.params?.studentName || "Kế hoạch IEP",
        })}
      />
      <TeacherRootStack.Screen
        name="IepObjectiveDetail"
        component={IepObjectiveDetailScreen}
        options={({ route }) => ({
          title: route.params?.objectiveName || "Chi tiết mục tiêu",
        })}
      />
    </TeacherRootStack.Navigator>
  );
}
