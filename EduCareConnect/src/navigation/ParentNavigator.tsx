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
} from "./types";
import { PlaceholderScreen } from "../screens/PlaceholderScreen";

const Tab = createBottomTabNavigator<ParentTabParamList>();
const ChildStack = createNativeStackNavigator<ParentChildStackParamList>();
const IepStack = createNativeStackNavigator<ParentIepStackParamList>();
const ReportStack = createNativeStackNavigator<ParentReportStackParamList>();

function ChildStackNavigator() {
  return (
    <ChildStack.Navigator>
      <ChildStack.Screen
        name="ChildProfile"
        component={PlaceholderScreen}
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
        component={PlaceholderScreen}
        options={{ title: "Kế hoạch IEP" }}
      />
      <IepStack.Screen
        name="ParentIepPlanDetail"
        component={PlaceholderScreen}
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
        component={PlaceholderScreen}
        options={{ title: "Báo cáo" }}
      />
      <ReportStack.Screen
        name="ParentReportDetail"
        component={PlaceholderScreen}
        options={{ title: "Chi tiết báo cáo" }}
      />
    </ReportStack.Navigator>
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
        component={PlaceholderScreen}
        options={{
          title: "Cá nhân",
          headerShown: true,
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