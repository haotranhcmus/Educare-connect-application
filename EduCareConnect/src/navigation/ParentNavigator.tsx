import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTheme } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type {
  ParentTabParamList,
  ParentChildStackParamList,
  ParentIepStackParamList,
  ParentReportStackParamList,
  ParentProfileStackParamList,
} from "./types";
import { ParentHomeScreen } from "../screens/parent/home/ParentHomeScreen";
import { ChildProfileScreen } from "../screens/parent/child/ChildProfileScreen";
import { ParentIepPlanScreen } from "../screens/parent/iep/ParentIepPlanScreen";
import { IepHistoryScreen } from "../screens/parent/iep/IepHistoryScreen";
import { ParentReportListScreen } from "../screens/parent/report/ParentReportListScreen";
import { ParentReportDetailScreen } from "../screens/parent/report/ParentReportDetailScreen";
import { ParentProfileScreen } from "../screens/parent/profile/ParentProfileScreen";
import { ChangePasswordScreen } from "../screens/teacher/profile/ChangePasswordScreen"; // reuse

const Tab = createBottomTabNavigator<ParentTabParamList>();
const ChildStack = createNativeStackNavigator<ParentChildStackParamList>();
const IepStack = createNativeStackNavigator<ParentIepStackParamList>();
const ReportStack = createNativeStackNavigator<ParentReportStackParamList>();
const ProfileStack = createNativeStackNavigator<ParentProfileStackParamList>();

function ChildStackNavigator() {
  return (
    <ChildStack.Navigator>
      <ChildStack.Screen
        name="ChildProfile"
        component={ChildProfileScreen}
        options={{ title: "Con tôi" }}
      />
    </ChildStack.Navigator>
  );
}

function IepStackNavigator() {
  return (
    <IepStack.Navigator>
      <IepStack.Screen
        name="ParentIepPlan"
        component={IepHistoryScreen}
        options={{ title: "Kế hoạch IEP" }}
      />
      <IepStack.Screen
        name="ParentIepPlanDetail"
        component={ParentIepPlanScreen}
        options={{ title: "Chi tiết IEP" }}
      />
    </IepStack.Navigator>
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
          headerShown: true,
          headerTitle: "Educare Connect",
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
            <MaterialCommunityIcons name="account" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="IepTab"
        component={IepStackNavigator}
        options={{
          title: "Kế hoạch IEP",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="clipboard-text"
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
        name="ParentProfileTab"
        component={ProfileStackNavigator}
        options={{
          title: "Cá nhân",
          headerShown: false,
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
