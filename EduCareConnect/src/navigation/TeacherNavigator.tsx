import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import {
  StackActions,
  getFocusedRouteNameFromRoute,
} from "@react-navigation/native";
import { useTheme, MD3Theme } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type {
  TeacherTabParamList,
  TeacherRootStackParamList,
  StudentStackParamList,
  SessionStackParamList,
  ReportStackParamList,
  ProfileStackParamList,
} from "./types";
import {
  GRADIENT_HEADER_OPTIONS,
  popToTopOnTabPress,
} from "./navigationHelpers";

import { StudentListScreen } from "../screens/teacher/student/StudentListScreen";
import { StudentDetailScreen } from "../screens/teacher/student/StudentDetailScreen";
import { HomeScreen } from "../screens/teacher/HomeScreen";
import { IepPlanDetailScreen } from "../screens/teacher/iep/IepPlanDetailScreen";
import { IepObjectiveDetailScreen } from "../screens/teacher/iep/IepObjectiveDetailScreen";
import { SessionListScreen } from "../screens/teacher/session/SessionListScreen";
import { SessionCreateScreen } from "../screens/teacher/session/SessionCreateScreen";
import { SessionDetailScreen } from "../screens/teacher/session/SessionDetailScreen";
import { SessionEditScreen } from "../screens/teacher/session/SessionEditScreen";
import { EvalObjectiveScreen } from "../screens/teacher/session/EvalObjectiveScreen";
import { EvalConfirmScreen } from "../screens/teacher/session/EvalConfirmScreen";
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
        name="EvalObjective"
        component={EvalObjectiveScreen as any}
        options={{ title: "Đánh giá mục tiêu" }}
      />
      <StudentStack.Screen
        name="EvalConfirm"
        component={EvalConfirmScreen as any}
        options={{ title: "Xác nhận" }}
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
        name="EvalObjective"
        component={EvalObjectiveScreen}
        options={{ title: "Đánh giá mục tiêu" }}
      />
      <SessionStack.Screen
        name="EvalConfirm"
        component={EvalConfirmScreen}
        options={{ title: "Xác nhận" }}
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

// --- Helpers for the tab bar ---

/**
 * Build the screenOptions function used by stack-backed tabs. Hides the tab
 * bar whenever the focused screen is deeper than the stack's root, so detail
 * screens get the full canvas.
 */
function makeStackTabOptions(
  theme: MD3Theme,
  rootScreenName: string,
  title: string,
  iconName: keyof typeof MaterialCommunityIcons.glyphMap,
) {
  const visibleTabBarStyle = {
    backgroundColor: theme.colors.surface,
    borderTopColor: theme.colors.outlineVariant,
  };
  return ({ route }: { route: any }) => {
    const focused = getFocusedRouteNameFromRoute(route) ?? rootScreenName;
    return {
      title,
      tabBarStyle:
        focused === rootScreenName
          ? visibleTabBarStyle
          : { display: "none" as const },
      tabBarIcon: ({ color, size }: { color: string; size: number }) => (
        <MaterialCommunityIcons name={iconName} size={size} color={color} />
      ),
    };
  };
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
        options={makeStackTabOptions(
          theme,
          "StudentList",
          "Học sinh",
          "account-group",
        )}
        listeners={popToTopOnTabPress}
      />
      <Tab.Screen
        name="SessionTab"
        component={SessionStackNavigator}
        options={makeStackTabOptions(
          theme,
          "SessionList",
          "Buổi học",
          "calendar-check",
        )}
        listeners={({ navigation, route }) => ({
          // SessionTab always re-focuses SessionList (clears any inbound
          // params like `filterNoReport` passed from HomeScreen).
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
        options={makeStackTabOptions(
          theme,
          "ReportList",
          "Báo cáo",
          "file-document",
        )}
        listeners={popToTopOnTabPress}
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
        listeners={popToTopOnTabPress}
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
        name="EvalObjective"
        component={EvalObjectiveScreen as any}
        options={{ title: "Đánh giá mục tiêu" }}
      />
      <TeacherRootStack.Screen
        name="EvalConfirm"
        component={EvalConfirmScreen as any}
        options={{ title: "Xác nhận" }}
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
