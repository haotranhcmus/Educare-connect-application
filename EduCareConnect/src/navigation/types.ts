import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { CompositeScreenProps } from "@react-navigation/native";
import type { NavigatorScreenParams } from "@react-navigation/native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";

// -- Root --
export type RootStackParamList = {
  Auth: undefined;
  TeacherTabs: undefined;
  ParentTabs: undefined;
};

// -- Auth --
export type AuthStackParamList = {
  Login: undefined;
};

// -- Teacher Bottom Tabs --
export type TeacherTabParamList = {
  HomeTab: undefined;
  StudentTab: undefined;
  SessionTab: undefined;
  ReportTab: undefined;
  ProfileTab: undefined;
};

export type TeacherRootStackParamList = {
  TeacherTabs: NavigatorScreenParams<TeacherTabParamList> | undefined;
  StudentDetail: { studentId: number };
  IepPlanDetail: { planId: number; studentName?: string };
  IepObjectiveDetail: { objectiveId: number; objectiveName?: string };
};

// -- Teacher: Student Stack --
export type StudentStackParamList = {
  StudentList: undefined;
  StudentDetail: { studentId: number };
  IepPlanDetail: { planId: number; studentName?: string };
  IepObjectiveDetail: { objectiveId: number; objectiveName?: string };
};

// -- Teacher: Session Stack --
export type SessionStackParamList = {
  SessionList: undefined;
  SessionCreate: { studentId?: number };
  SessionDetail: { sessionId: number };
  SessionEdit: { sessionId: number };
  EvalStep1: { sessionId: number };
  EvalStep2: { sessionId: number; objectiveIndex?: number };
  EvalStep3: { sessionId: number };
  EvalDetailView: { sessionId: number };
};

// Backward-compatible alias for old imports.
export type TeacherSessionStackParamList = SessionStackParamList;

// -- Teacher: Report Stack --
export type ReportStackParamList = {
  ReportList: undefined;
  SessionPicker: undefined;
  ReportCreate: { sessionId?: number; reportId?: number };
  ReportDetail: { reportId: number };
};

// -- Teacher: Profile Stack --
export type ProfileStackParamList = {
  Profile: undefined;
  ChangePassword: undefined;
};

export type ParentProfileStackParamList = ProfileStackParamList;

// -- Parent Bottom Tabs --
export type ParentTabParamList = {
  ParentHomeTab: undefined;
  ChildTab: undefined;
  TimetableTab: undefined;
  ReportTab: undefined;
  ParentProfileTab: undefined;
};

// -- Parent: Child Stack --
export type ParentChildStackParamList = {
  ChildList: undefined;
  ChildDetail: { studentId: number; studentName?: string };
  ChildIepHistory: undefined;
  ChildIepPlanDetail: { planId: number };
  ChildIepObjectiveDetail: { objectiveId: number };
  ChildTimetable: undefined;
};

// -- Parent: Timetable Stack --
export type ParentTimetableStackParamList = {
  Timetable: undefined;
  ChildIepHistory: undefined;
  ChildIepPlanDetail: { planId: number };
  ChildIepObjectiveDetail: { objectiveId: number };
};

// -- Parent: IEP Stack (legacy – kept for backward-compat) --
export type ParentIepStackParamList = {
  ParentIepPlan: undefined;
  ParentIepPlanDetail: { planId: number };
};

// -- Composite types for screens that need both tab + stack navigation --
export type StudentListScreenProps = CompositeScreenProps<
  NativeStackScreenProps<StudentStackParamList, "StudentList">,
  BottomTabScreenProps<TeacherTabParamList>
>;

export type TeacherIepStackParamList = {
  IepPlanList: undefined;
  IepPlanDetail: { planId: number };
  IepObjectiveDetail: { objectiveId: number };
};

export type TeacherProfileStackParamList = {
  Profile: undefined;
  ChangePassword: undefined;
};

// Update TeacherReportStackParamList
export type TeacherReportStackParamList = {
  ReportList: undefined;
  ReportCreate: { sessionId?: number; reportId?: number } | undefined;
  ReportDetail: { reportId: number };
  SessionPicker: undefined;
};

export type ParentReportStackParamList = {
  ParentReportList: undefined;
  ParentReportDetail: { reportId: number };
};
