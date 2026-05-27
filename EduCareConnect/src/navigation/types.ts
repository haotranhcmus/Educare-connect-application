import type { NavigatorScreenParams } from "@react-navigation/native";

// -- Auth --
export type AuthStackParamList = {
  Login: undefined;
};

// -- Teacher Bottom Tabs --
export type TeacherTabParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList> | undefined;
  StudentTab: undefined;
  SessionTab: NavigatorScreenParams<SessionStackParamList> | undefined;
  ReportTab: undefined;
  ProfileTab: undefined;
};

// Shared chat route params — reused inside HomeStack (teacher + parent).
export type ChatRoomParams = {
  conversationId: number;
  counterpartName: string;
  counterpartAvatar?: string | null;
};

// -- Teacher: Home Stack --
// Contains: HomeScreen + NotificationList + Chat screens. Chat is reached
// from the header icon on HomeScreen so the tab bar auto-hides while
// chatting and Back returns to Home.
export type HomeStackParamList = {
  Home: undefined;
  NotificationList: undefined;
  ConversationList: undefined;
  ChatRoom: ChatRoomParams;
  AiChat: undefined;
};

export type TeacherRootStackParamList = {
  TeacherTabs: NavigatorScreenParams<TeacherTabParamList> | undefined;
  StudentDetail: { studentId: number };
  IepPlanDetail: { planId: number; studentName?: string };
  IepObjectiveDetail: { objectiveId: number; objectiveName?: string };
  // Session/report screens accessible above tabs (e.g. from HomeScreen)
  SessionDetail: { sessionId: number };
  SessionEdit: { sessionId: number };
  EvalObjective: { sessionId: number; objectiveIndex?: number };
  EvalConfirm: { sessionId: number };
  ReportDetail: { reportId: number };
  ReportCreate: { sessionId?: number; reportId?: number };
};

// -- Teacher: Student Stack --
export type StudentStackParamList = {
  StudentList: undefined;
  StudentDetail: { studentId: number };
  IepPlanDetail: { planId: number; studentName?: string };
  IepObjectiveDetail: { objectiveId: number; objectiveName?: string };
  // Session/report screens within student context (no tab switch)
  SessionDetail: { sessionId: number };
  SessionEdit: { sessionId: number };
  EvalObjective: { sessionId: number; objectiveIndex?: number };
  EvalConfirm: { sessionId: number };
  ReportDetail: { reportId: number };
  ReportCreate: { sessionId?: number; reportId?: number };
};

// -- Teacher: Session Stack --
export type SessionStackParamList = {
  SessionList: { filterNoReport?: boolean } | undefined;
  SessionCreate: { studentId?: number };
  SessionDetail: { sessionId: number };
  SessionEdit: { sessionId: number };
  EvalObjective: { sessionId: number; objectiveIndex?: number };
  EvalConfirm: { sessionId: number };
  // Report screens reachable from session detail (no tab switch)
  ReportDetail: { reportId: number };
  ReportCreate: { sessionId?: number; reportId?: number };
};

// Backward-compatible alias used by EvalObjective/EvalConfirm screens.
export type TeacherSessionStackParamList = SessionStackParamList;

// -- Teacher: Report Stack --
export type ReportStackParamList = {
  ReportList: undefined;
  SessionPicker: undefined;
  ReportCreate: { sessionId?: number; reportId?: number };
  ReportDetail: { reportId: number };
};

// -- Profile Stack (shared shape between teacher and parent) --
export type ProfileStackParamList = {
  Profile: undefined;
  ChangePassword: undefined;
};

export type ParentProfileStackParamList = ProfileStackParamList;

// IEP stack type still imported by IepObjectiveDetailScreen for its route props.
export type TeacherIepStackParamList = {
  IepPlanList: undefined;
  IepPlanDetail: { planId: number };
  IepObjectiveDetail: { objectiveId: number };
};

// -- Parent Bottom Tabs --
export type ParentTabParamList = {
  ParentHomeTab: NavigatorScreenParams<ParentHomeStackParamList> | undefined;
  ChildTab: undefined;
  TimetableTab: undefined;
  ReportTab: undefined;
  ParentProfileTab: undefined;
};

// -- Parent: Home Stack --
// Contains: ParentHomeScreen + NotificationList + Chat screens +
// detail screens for notification deep-link. Chat opens from the header
// icon on ParentHomeScreen so the bottom tab bar hides while chatting.
export type ParentHomeStackParamList = {
  ParentHome: undefined;
  NotificationList: undefined;
  ConversationList: undefined;
  ChatRoom: ChatRoomParams;
  AiChat: undefined;
  ParentReportDetail: { reportId: number };
  IepPlanDetail: { planId: number; studentName?: string };
  IepObjectiveDetail: { objectiveId: number; objectiveName?: string };
};

// -- Parent: Child Stack --
export type ParentChildStackParamList = {
  ChildList: undefined;
  ChildDetail: { studentId: number; studentName?: string };
  ChildIepHistory: undefined;
  ChildIepPlanDetail: { planId: number };
  ChildIepObjectiveDetail: { objectiveId: number };
  ChildTimetable: undefined;
  SessionDetail: { sessionId: number };
};

// -- Parent: Timetable Stack --
export type ParentTimetableStackParamList = {
  Timetable: undefined;
  ChildIepHistory: undefined;
  ChildIepPlanDetail: { planId: number };
  ChildIepObjectiveDetail: { objectiveId: number };
  SessionDetail: { sessionId: number };
};

export type ParentReportStackParamList = {
  ParentReportList: undefined;
  ParentReportDetail: { reportId: number };
};
