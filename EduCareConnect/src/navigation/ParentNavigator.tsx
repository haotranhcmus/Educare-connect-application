import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import {
  StackActions,
  getFocusedRouteNameFromRoute,
  type RouteProp,
} from "@react-navigation/native";
import { useTheme } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useParentStore } from "@store/parentStore";
import type {
  ParentTabParamList,
  ParentHomeStackParamList,
  ParentChildStackParamList,
  ParentTimetableStackParamList,
  ParentReportStackParamList,
  ParentProfileStackParamList,
} from "@navigation/types";
import {
  useHeaderOptions,
  popToTopOnTabPress,
} from "@navigation/navigationHelpers";
import { ParentHomeScreen } from "@screens/parent/home/ParentHomeScreen";
import { ChildListScreen } from "@screens/parent/child/ChildListScreen";
import { ChildProfileScreen } from "@screens/parent/child/ChildProfileScreen";
import { ChildTimetableScreen } from "@screens/parent/child/ChildTimetableScreen";
import { ChildIepHistoryScreen } from "@screens/parent/iep/ChildIepHistoryScreen";
import { IepPlanDetailScreen } from "@screens/teacher/iep/IepPlanDetailScreen";
import { IepObjectiveDetailScreen } from "@screens/teacher/iep/IepObjectiveDetailScreen";
import { ParentReportListScreen } from "@screens/parent/report/ParentReportListScreen";
import { ParentReportDetailScreen } from "@screens/parent/report/ParentReportDetailScreen";
import { ParentProfileScreen } from "@screens/parent/profile/ParentProfileScreen";
import { ChangePasswordScreen } from "@screens/teacher/profile/ChangePasswordScreen";
import { NotificationListScreen } from "@screens/common/NotificationListScreen";
import { ConversationListScreen } from "@screens/common/ConversationListScreen";
import { ChatRoomScreen } from "@screens/common/ChatRoomScreen";
import { AiChatScreen } from "@screens/common/AiChatScreen";
import { ParentSessionDetailScreen } from "@screens/parent/session/ParentSessionDetailScreen";

import { ErrorBoundary } from "@components/common/ErrorBoundary";
import { ScreenErrorFallback } from "@components/common/ScreenErrorFallback";

const Tab = createBottomTabNavigator<ParentTabParamList>();
const HomeStack = createNativeStackNavigator<ParentHomeStackParamList>();
const ChildStack = createNativeStackNavigator<ParentChildStackParamList>();
const TimetableStack =
  createNativeStackNavigator<ParentTimetableStackParamList>();
const ReportStack = createNativeStackNavigator<ParentReportStackParamList>();
const ProfileStack = createNativeStackNavigator<ParentProfileStackParamList>();

// Routes that should hide the bottom tab bar when focused (deep detail screens).
const HIDE_TAB_BAR_ROUTES = new Set<string>([
  "ChildIepHistory",
  "ChildIepPlanDetail",
  "ChildIepObjectiveDetail",
  "ChildTimetable", // when pushed from ChildDetail (not the Timetable tab root)
  "ParentReportDetail",
  "ChangePassword",
  "NotificationList",
  "IepPlanDetail",
  "IepObjectiveDetail",
  "ConversationList",
  "ChatRoom",
  "AiChat",
  "SessionDetail",
]);

function tabBarStyleForRoute(route: RouteProp<ParentTabParamList>) {
  const routeName = getFocusedRouteNameFromRoute(route);
  if (routeName && HIDE_TAB_BAR_ROUTES.has(routeName)) {
    return { display: "none" as const };
  }
  return undefined;
}

// ── Stack navigators ──────────────────────────────────────────────

function ChildStackNavigator() {
  const headerOptions = useHeaderOptions();
  return (
    <ErrorBoundary
      name="ChildStack"
      fallback={(error, reset) => (
        <ScreenErrorFallback error={error} reset={reset} />
      )}
    >
      <ChildStack.Navigator screenOptions={headerOptions}>
        <ChildStack.Screen
          name="ChildList"
          component={ChildListScreen}
          options={{ title: "Hồ sơ" }}
        />
        <ChildStack.Screen
          name="ChildDetail"
          component={ChildProfileScreen}
          options={{ headerShown: false }}
        />
        <ChildStack.Screen
          name="ChildIepHistory"
          component={ChildIepHistoryScreen}
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
          options={{ title: "Chi tiết mục tiêu" }}
        />
        <ChildStack.Screen
          name="ChildTimetable"
          component={ChildTimetableScreen}
          options={{ headerShown: false }}
        />
        <ChildStack.Screen
          name="SessionDetail"
          component={ParentSessionDetailScreen as any}
          options={{ title: "Chi tiết buổi học" }}
        />
      </ChildStack.Navigator>
    </ErrorBoundary>
  );
}

function TimetableStackNavigator() {
  const headerOptions = useHeaderOptions();
  return (
    <ErrorBoundary
      name="TimetableStack"
      fallback={(error, reset) => (
        <ScreenErrorFallback error={error} reset={reset} />
      )}
    >
      <TimetableStack.Navigator screenOptions={headerOptions}>
        <TimetableStack.Screen
          name="Timetable"
          component={ChildTimetableScreen}
          options={{ headerShown: false }}
        />
        <TimetableStack.Screen
          name="ChildIepHistory"
          component={ChildIepHistoryScreen}
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
          options={{ title: "Chi tiết mục tiêu" }}
        />
        <TimetableStack.Screen
          name="SessionDetail"
          component={ParentSessionDetailScreen as any}
          options={{ title: "Chi tiết buổi học" }}
        />
      </TimetableStack.Navigator>
    </ErrorBoundary>
  );
}

function ReportStackNavigator() {
  const headerOptions = useHeaderOptions();
  return (
    <ErrorBoundary
      name="ReportStack"
      fallback={(error, reset) => (
        <ScreenErrorFallback error={error} reset={reset} />
      )}
    >
      <ReportStack.Navigator screenOptions={headerOptions}>
        <ReportStack.Screen
          name="ParentReportList"
          component={ParentReportListScreen}
          options={{ headerShown: false }}
        />
        <ReportStack.Screen
          name="ParentReportDetail"
          component={ParentReportDetailScreen}
          options={{ title: "Chi tiết báo cáo" }}
        />
      </ReportStack.Navigator>
    </ErrorBoundary>
  );
}

function ProfileStackNavigator() {
  const headerOptions = useHeaderOptions();
  return (
    <ErrorBoundary
      name="ProfileStack"
      fallback={(error, reset) => (
        <ScreenErrorFallback error={error} reset={reset} />
      )}
    >
      <ProfileStack.Navigator screenOptions={headerOptions}>
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
    </ErrorBoundary>
  );
}

function HomeStackNavigator() {
  const headerOptions = useHeaderOptions();
  return (
    <ErrorBoundary
      name="ParentHomeStack"
      fallback={(error, reset) => (
        <ScreenErrorFallback error={error} reset={reset} />
      )}
    >
      <HomeStack.Navigator screenOptions={headerOptions}>
        <HomeStack.Screen
          name="ParentHome"
          component={ParentHomeScreen}
          options={{ headerShown: false }}
        />
        <HomeStack.Screen
          name="NotificationList"
          component={NotificationListScreen}
          options={{ title: "Thông báo" }}
        />
        <HomeStack.Screen
          name="ConversationList"
          component={ConversationListScreen}
          options={{ title: "Tin nhắn" }}
        />
        <HomeStack.Screen
          name="ChatRoom"
          component={ChatRoomScreen}
          options={{ title: "" }}
        />
        <HomeStack.Screen
          name="AiChat"
          component={AiChatScreen}
          options={{ title: "Trợ lý AI" }}
        />
        {/* Detail screens registered here so tapping a notification can `push`
            within the same stack and back returns to the notification list. */}
        <HomeStack.Screen
          name="ParentReportDetail"
          component={ParentReportDetailScreen}
          options={{ title: "Chi tiết báo cáo" }}
        />
        <HomeStack.Screen
          name="IepPlanDetail"
          component={IepPlanDetailScreen}
          options={{ title: "Kế hoạch IEP" }}
        />
        <HomeStack.Screen
          name="IepObjectiveDetail"
          component={IepObjectiveDetailScreen as any}
          options={({ route }) => ({
            title: (route.params as any)?.objectiveName || "Chi tiết mục tiêu",
          })}
        />
      </HomeStack.Navigator>
    </ErrorBoundary>
  );
}

// ── Tab navigator ─────────────────────────────────────────────────

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
        component={HomeStackNavigator}
        options={({ route }) => ({
          title: "Trang chủ",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home" size={size} color={color} />
          ),
          tabBarStyle: tabBarStyleForRoute(route),
        })}
        listeners={popToTopOnTabPress}
      />
      <Tab.Screen
        name="ChildTab"
        component={ChildStackNavigator}
        options={({ route }) => ({
          title: "Hồ sơ",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="account-child"
              size={size}
              color={color}
            />
          ),
          tabBarStyle: tabBarStyleForRoute(route),
        })}
        listeners={({ navigation, route }) => ({
          // ChildTab: jump straight into the previously-selected child's detail
          // screen (if any). Otherwise reset the inner stack and focus the tab.
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
              return;
            }
            const r = route as any;
            if (r.state && r.state.index > 0) {
              navigation.dispatch({
                ...StackActions.popToTop(),
                target: r.state.key,
              });
            }
            navigation.navigate(route.name as any);
          },
        })}
      />
      <Tab.Screen
        name="TimetableTab"
        component={TimetableStackNavigator}
        options={({ route }) => ({
          title: "Thời khóa biểu",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="calendar-week"
              size={size}
              color={color}
            />
          ),
          tabBarStyle: tabBarStyleForRoute(route),
        })}
        listeners={popToTopOnTabPress}
      />
      <Tab.Screen
        name="ReportTab"
        component={ReportStackNavigator}
        options={({ route }) => ({
          title: "Báo cáo",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="file-document"
              size={size}
              color={color}
            />
          ),
          tabBarStyle: tabBarStyleForRoute(route),
        })}
        listeners={popToTopOnTabPress}
      />
      <Tab.Screen
        name="ParentProfileTab"
        component={ProfileStackNavigator}
        options={({ route }) => ({
          title: "Cá nhân",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="account-circle"
              size={size}
              color={color}
            />
          ),
          tabBarStyle: tabBarStyleForRoute(route),
        })}
        listeners={popToTopOnTabPress}
      />
    </Tab.Navigator>
  );
}
