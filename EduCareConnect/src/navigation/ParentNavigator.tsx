import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StackActions } from "@react-navigation/native";
import { useTheme } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useParentStore } from "../store/parentStore";
import type {
  ParentTabParamList,
  ParentChildStackParamList,
  ParentTimetableStackParamList,
  ParentReportStackParamList,
  ParentProfileStackParamList,
} from "./types";
import { ParentHomeScreen } from "../screens/parent/home/ParentHomeScreen";
import { ChildListScreen } from "../screens/parent/child/ChildListScreen";
import { ChildProfileScreen } from "../screens/parent/child/ChildProfileScreen";
import { ChildTimetableScreen } from "../screens/parent/child/ChildTimetableScreen";
import { IepHistoryScreen } from "../screens/parent/iep/IepHistoryScreen";
import { IepPlanDetailScreen } from "../screens/teacher/iep/IepPlanDetailScreen";
import { IepObjectiveDetailScreen } from "../screens/teacher/iep/IepObjectiveDetailScreen";
import { ParentReportListScreen } from "../screens/parent/report/ParentReportListScreen";
import { ParentReportDetailScreen } from "../screens/parent/report/ParentReportDetailScreen";
import { ParentProfileScreen } from "../screens/parent/profile/ParentProfileScreen";
import { ChangePasswordScreen } from "../screens/teacher/profile/ChangePasswordScreen";

const Tab = createBottomTabNavigator<ParentTabParamList>();
const ChildStack = createNativeStackNavigator<ParentChildStackParamList>();
const TimetableStack =
  createNativeStackNavigator<ParentTimetableStackParamList>();
const ReportStack = createNativeStackNavigator<ParentReportStackParamList>();
const ProfileStack = createNativeStackNavigator<ParentProfileStackParamList>();

function ChildStackNavigator() {
  return (
    <ChildStack.Navigator>
      <ChildStack.Screen
        name="ChildList"
        component={ChildListScreen}
        options={{ title: "Con tôi" }}
      />
      <ChildStack.Screen
        name="ChildDetail"
        component={ChildProfileScreen}
        options={({ route }) => ({
          title: "Hồ sơ " + (route.params as any)?.studentName,
          headerShown: false,
        })}
      />
      <ChildStack.Screen
        name="ChildIepHistory"
        component={IepHistoryScreen}
        options={{ title: "Kế hoạch IEP" }}
      />
      <ChildStack.Screen
        name="ChildIepPlanDetail"
        component={IepPlanDetailScreen as any}
        options={{ title: "Chi tiết kế hoạch IEP" }}
      />
      <ChildStack.Screen
        name="ChildIepObjectiveDetail"
        component={IepObjectiveDetailScreen as any}
        options={{ title: "Chi tiết mục tiêu ngắn hạn" }}
      />
      <ChildStack.Screen
        name="ChildTimetable"
        component={ChildTimetableScreen}
        options={{ title: "Thời khóa biểu" }}
      />
    </ChildStack.Navigator>
  );
}

function TimetableStackNavigator() {
  return (
    <TimetableStack.Navigator>
      <TimetableStack.Screen
        name="Timetable"
        component={ChildTimetableScreen}
        options={{ title: "Thời khóa biểu" }}
      />
      <TimetableStack.Screen
        name="ChildIepHistory"
        component={IepHistoryScreen}
        options={{ title: "Kế hoạch IEP" }}
      />
      <TimetableStack.Screen
        name="ChildIepPlanDetail"
        component={IepPlanDetailScreen as any}
        options={{ title: "Chi tiết kế hoạch IEP" }}
      />
      <TimetableStack.Screen
        name="ChildIepObjectiveDetail"
        component={IepObjectiveDetailScreen as any}
        options={{ title: "Chi tiết mục tiêu ngắn hạn" }}
      />
    </TimetableStack.Navigator>
  );
}

function ReportStackNavigator() {
  return (
    <ReportStack.Navigator>
      <ReportStack.Screen
        name="ParentReportList"
        component={ParentReportListScreen}
        options={{ title: "Báo cáo" }}
      />
      <ReportStack.Screen
        name="ParentReportDetail"
        component={ParentReportDetailScreen}
        options={{ title: "Chi tiết báo cáo" }}
      />
    </ReportStack.Navigator>
  );
}

function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator>
      <ProfileStack.Screen
        name="Profile"
        component={ParentProfileScreen}
        options={{ headerShown: false }}
      />
      <ProfileStack.Screen
        name="ChangePassword"
        component={ChangePasswordScreen}
        options={{ title: "Đổi mật khẩu" }}
      />
    </ProfileStack.Navigator>
  );
}

export function ParentNavigator() {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.outline,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.outlineVariant,
        },
      }}
    >
      <Tab.Screen
        name="ParentHomeTab"
        component={ParentHomeScreen}
        options={{
          title: "Trang chủ",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ChildTab"
        component={ChildStackNavigator}
        options={{
          title: "Con tôi",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="account-child"
              size={size}
              color={color}
            />
          ),
        }}
        listeners={({ navigation, route }) => ({
          tabPress: (e) => {
            e.preventDefault();
            const { selectedStudentId, selectedStudent } =
              useParentStore.getState();
            if (selectedStudentId && selectedStudent) {
              navigation.navigate(route.name as any, {
                screen: "ChildDetail",
                params: {
                  studentId: selectedStudentId,
                  studentName: selectedStudent.name,
                },
              });
            } else {
              const r = route as any;
              if (r.state && r.state.index > 0) {
                navigation.dispatch({
                  ...StackActions.popToTop(),
                  target: r.state.key,
                });
              }
              navigation.navigate(route.name as any);
            }
          },
        })}
      />
      <Tab.Screen
        name="TimetableTab"
        component={TimetableStackNavigator}
        options={{
          title: "Thời khóa biểu",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="calendar-week"
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
        name="ParentProfileTab"
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
