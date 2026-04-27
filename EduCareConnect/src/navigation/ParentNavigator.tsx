import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StackActions } from "@react-navigation/native";
import { useTheme } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type {
  ParentTabParamList,
  ParentTimetableStackParamList,
  ParentReportStackParamList,
  ParentProfileStackParamList,
} from "./types";
import { ParentHomeScreen } from "../screens/parent/home/ParentHomeScreen";
import { ChildTimetableScreen } from "../screens/parent/child/ChildTimetableScreen";
import { IepHistoryScreen } from "../screens/parent/iep/IepHistoryScreen";
import { ParentIepPlanScreen } from "../screens/parent/iep/ParentIepPlanScreen";
import { ParentReportListScreen } from "../screens/parent/report/ParentReportListScreen";
import { ParentReportDetailScreen } from "../screens/parent/report/ParentReportDetailScreen";
import { ParentProfileScreen } from "../screens/parent/profile/ParentProfileScreen";
import { ChangePasswordScreen } from "../screens/teacher/profile/ChangePasswordScreen";

const Tab = createBottomTabNavigator<ParentTabParamList>();
const TimetableStack =
  createNativeStackNavigator<ParentTimetableStackParamList>();
const ReportStack = createNativeStackNavigator<ParentReportStackParamList>();
const ProfileStack = createNativeStackNavigator<ParentProfileStackParamList>();

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
        component={ParentIepPlanScreen}
        options={{ title: "Chi tiết kế hoạch IEP" }}
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
