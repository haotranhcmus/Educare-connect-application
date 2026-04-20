import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { CompositeScreenProps } from "@react-navigation/native";
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
  EvalStep2: { sessionId: number };
  EvalStep3: { sessionId: number };
};

// -- Teacher: Report Stack --
export type ReportStackParamList = {
  ReportList: undefined;
  ReportCreate: { sessionId?: number };
  ReportDetail: { reportId: number };
};

// -- Teacher: Profile Stack --
export type ProfileStackParamList = {
  Profile: undefined;
  ChangePassword: undefined;
};

// -- Parent Bottom Tabs --
export type ParentTabParamList = {
  ParentHomeTab: undefined;
  ChildTab: undefined;
  IepTab: undefined;
  ReportTab: undefined;
  ParentProfileTab: undefined;
};

// -- Parent: Child Stack --
export type ParentChildStackParamList = {
  ChildProfile: undefined;
};

// -- Parent: IEP Stack --
export type ParentIepStackParamList = {
  ParentIepPlan: undefined;
  ParentIepPlanDetail: { planId: number };
};

// -- Parent: Report Stack --
export type ParentReportStackParamList = {
  ParentReportList: undefined;
  ParentReportDetail: { reportId: number };
};

// -- Composite types for screens that need both tab + stack navigation --
export type StudentListScreenProps = CompositeScreenProps<
  NativeStackScreenProps<StudentStackParamList, "StudentList">,
  BottomTabScreenProps<TeacherTabParamList>
>;