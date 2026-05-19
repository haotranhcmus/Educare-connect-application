import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StackActions, getFocusedRouteNameFromRoute } from "@react-navigation/native";
import { useTheme } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { GradientHeader } from "../components/common/GradientHeader";
import type {
  TeacherTabParamList,
  TeacherRootStackParamList,
  StudentStackParamList,
  SessionStackParamList,
  ReportStackParamList,
  ProfileStackParamList,
} from "./types";

import { StudentListScreen } from "../screens/teacher/student/StudentListScreen";
import { StudentDetailScreen } from "../screens/teacher/student/StudentDetailScreen";
import { HomeScreen } from "../screens/teacher/HomeScreen";
import { IepPlanDetailScreen } from "../screens/teacher/iep/IepPlanDetailScreen";
import { IepObjectiveDetailScreen } from "../screens/teacher/iep/IepObjectiveDetailScreen";
import { SessionListScreen } from "../screens/teacher/session/SessionListScreen";
import { SessionCreateScreen } from "../screens/teacher/session/SessionCreateScreen";
import { SessionDetailScreen } from "../screens/teacher/session/SessionDetailScreen";
import { SessionEditScreen } from "../screens/teacher/session/SessionEditScreen";
import { EvalStep2Screen } from "../screens/teacher/session/EvalStep2Screen";
import { EvalStep3Screen } from "../screens/teacher/session/EvalStep3Screen";
import { ReportListScreen } from "../screens/teacher/report/ReportListScreen";
import { TeacherProfileScreen } from "../screens/teacher/profile/TeacherProfileScreen";
import { ReportCreateScreen } from "../screens/teacher/report/ReportCreateScreen";
import { ReportDetailScreen } from "../screens/teacher/report/ReportDetailScreen";
import { SessionPickerScreen } from "../screens/teacher/report/SessionPickerScreen";
import { ChangePasswordScreen } from "../screens/teacher/profile/ChangePasswordScreen";
import { LinearGradient } from "expo-linear-gradient";
import { ImageBackgroundComponent } from "react-native";
import { NativeStackNavigationOptions } from "@react-navigation/native-stack";

const Tab = createBottomTabNavigator<TeacherTabParamList>();
const TeacherRootStack =
  createNativeStackNavigator<TeacherRootStackParamList>();
const StudentStack = createNativeStackNavigator<StudentStackParamList>();
const SessionStack = createNativeStackNavigator<SessionStackParamList>();
const ReportStack = createNativeStackNavigator<ReportStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

// Shared gradient header options for all stack navigators
const GRADIENT_HEADER_OPTIONS: NativeStackNavigationOptions = {
  headerShown: true,
  // headerBackground: () => (
  //   <LinearGradient
  //     colors={["#1B5E20", "#2E7D32", "#388E3C"]}
  //     start={{ x: 0, y: 0 }}
  //     end={{ x: 1, y: 0 }}
  //     style={{ flex: 1 }}
  //   />
  // ),
  headerTintColor: "#FFFFFF",
  headerTitleStyle: {
    color: "#FFFFFF",
    fontWeight: "700" as const,
    fontSize: 17,
  },
  headerStyle: {
    backgroundColor: "#2E7D32",
    // ImageBackgroundComponent: (
    //   <LinearGradient
    //     colors={["#1B5E20", "#2E7D32", "#388E3C"]}
    //     start={{ x: 0, y: 0 }}
    //     end={{ x: 1, y: 0 }}
    //     style={{ flex: 1 }}
    //   />
    // ), // Use LinearGradient for header background
  },
};

// --- Stack Navigators ---

function StudentStackNavigator() {
  return (
    <StudentStack.Navigator screenOptions={GRADIENT_HEADER_OPTIONS}>
      <StudentStack.Screen
        name="StudentList"
        component={StudentListScreen}
        options={{ title: "Học sinh" }}
      />
      <StudentStack.Screen
        name="StudentDetail"
        component={StudentDetailScreen}
        options={{ title: "Chi tiết học sinh" }}
      />
      <StudentStack.Screen
        name="IepPlanDetail"
        component={IepPlanDetailScreen}
        options={{ title: "Kế hoạch IEP" }}
      />
      <StudentStack.Screen
        name="IepObjectiveDetail"
        component={IepObjectiveDetailScreen as any}
        options={({ route }) => ({
          title: (route.params as any)?.objectiveName || "Chi tiết mục tiêu",
        })}
      />
      <StudentStack.Screen
        name="SessionDetail"
        component={SessionDetailScreen as any}
        options={{ title: "Chi tiết buổi học" }}
      />
      <StudentStack.Screen
        name="SessionEdit"
        component={SessionEditScreen as any}
        options={{ title: "Sửa buổi học" }}
      />
      <StudentStack.Screen
        name="EvalStep2"
        component={EvalStep2Screen as any}
        options={{ title: "Đánh giá mục tiêu" }}
      />
      <StudentStack.Screen
        name="EvalStep3"
        component={EvalStep3Screen as any}
        options={{ title: "Xác nhận & Hoàn thành" }}
      />
      <StudentStack.Screen
        name="ReportDetail"
        component={ReportDetailScreen as any}
        options={{ title: "Chi tiết báo cáo" }}
      />
      <StudentStack.Screen
        name="ReportCreate"
        component={ReportCreateScreen as any}
        options={{ title: "Tạo báo cáo" }}
      />
    </StudentStack.Navigator>
  );
}

function SessionStackNavigator() {
  return (
    <SessionStack.Navigator screenOptions={GRADIENT_HEADER_OPTIONS}>
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
        name="ReportDetail"
        component={ReportDetailScreen as any}
        options={{ title: "Chi tiết báo cáo" }}
      />
      <SessionStack.Screen
        name="ReportCreate"
        component={ReportCreateScreen as any}
        options={{ title: "Tạo báo cáo" }}
      />
    </SessionStack.Navigator>
  );
}

function ReportStackNavigator() {
  return (
    <ReportStack.Navigator screenOptions={GRADIENT_HEADER_OPTIONS}>
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
    <ProfileStack.Navigator screenOptions={GRADIENT_HEADER_OPTIONS}>
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
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="StudentTab"
        component={StudentStackNavigator}
        options={({ route }) => {
          const focused = getFocusedRouteNameFromRoute(route) ?? "StudentList";
          return {
            title: "Học sinh",
            tabBarStyle:
              focused === "StudentList"
                ? { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.outlineVariant }
                : { display: "none" },
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="account-group" size={size} color={color} />
            ),
          };
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
        options={({ route }) => {
          const focused = getFocusedRouteNameFromRoute(route) ?? "SessionList";
          return {
            title: "Buổi học",
            tabBarStyle:
              focused === "SessionList"
                ? { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.outlineVariant }
                : { display: "none" },
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="calendar-check" size={size} color={color} />
            ),
          };
        }}
        listeners={({ navigation, route }) => ({
          tabPress: (e) => {
            e.preventDefault();
            const r = route as any;
            if (r.state && r.state.index > 0) {
              navigation.dispatch({
                ...StackActions.popToTop(),
                target: r.state.key,
              });
            }
            navigation.navigate(route.name as any, { screen: "SessionList" });
          },
        })}
      />
      <Tab.Screen
        name="ReportTab"
        component={ReportStackNavigator}
        options={({ route }) => {
          const focused = getFocusedRouteNameFromRoute(route) ?? "ReportList";
          return {
            title: "Báo cáo",
            tabBarStyle:
              focused === "ReportList"
                ? { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.outlineVariant }
                : { display: "none" },
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="file-document" size={size} color={color} />
            ),
          };
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
    <TeacherRootStack.Navigator screenOptions={GRADIENT_HEADER_OPTIONS}>
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
        options={{ title: "Kế hoạch IEP" }}
      />
      <TeacherRootStack.Screen
        name="IepObjectiveDetail"
        component={IepObjectiveDetailScreen as any}
        options={({ route }) => ({
          title: (route.params as any)?.objectiveName || "Chi tiết mục tiêu",
        })}
      />
      <TeacherRootStack.Screen
        name="SessionDetail"
        component={SessionDetailScreen as any}
        options={{ title: "Chi tiết buổi học" }}
      />
      <TeacherRootStack.Screen
        name="SessionEdit"
        component={SessionEditScreen as any}
        options={{ title: "Sửa buổi học" }}
      />
      <TeacherRootStack.Screen
        name="EvalStep2"
        component={EvalStep2Screen as any}
        options={{ title: "Đánh giá mục tiêu" }}
      />
      <TeacherRootStack.Screen
        name="EvalStep3"
        component={EvalStep3Screen as any}
        options={{ title: "Xác nhận & Hoàn thành" }}
      />
      <TeacherRootStack.Screen
        name="ReportDetail"
        component={ReportDetailScreen as any}
        options={{ title: "Chi tiết báo cáo" }}
      />
      <TeacherRootStack.Screen
        name="ReportCreate"
        component={ReportCreateScreen as any}
        options={{ title: "Tạo báo cáo" }}
      />
    </TeacherRootStack.Navigator>
  );
}
