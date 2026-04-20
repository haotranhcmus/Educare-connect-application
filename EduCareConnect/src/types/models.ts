import type {
  StudentStatus,
  Gender,
  PrimaryDiagnosis,
  LearningStyle,
  CommunicationLevel,
  IepPlanStatus,
  ReviewFrequency,
  GoalStatus,
  GoalPriority,
  ObjectiveStatus,
  Trend,
  SessionStatus,
  SessionLocation,
  SessionType,
  SessionPurpose,
  Attendance,
  Mood,
  EnergyLevel,
  EngagementLevel,
  OverallPerformance,
  PromptLevel,
  ResultType,
  Phase,
  TeachingMethod,
  ReportStatus,
  UserRole,
  ProfileStatus,
  ParentRelation,
  PreferredContact,
} from "./enums";

// ===== Helper types =====

/** Odoo Many2one field → [id, display_name] */
export interface OdooRef {
  id: number;
  name: string;
}

// ===== Student =====

export interface StudentListItem {
  id: number;
  name: string;
  student_code: string;
  status: StudentStatus;
  primary_diagnosis: PrimaryDiagnosis | false;
  /** Avatar URL nếu có */
  avatar_url?: string;
  /** Latest IEP plan info cho badge trên list */
  latest_iep_status?: IepPlanStatus;
  latest_iep_period?: string;
}

export interface StudentDetail {
  id: number;
  name: string;
  student_code: string;
  date_of_birth: string; // "YYYY-MM-DD"
  age: number;
  gender: Gender;
  status: StudentStatus;
  avatar_url?: string;

  // Enrollment
  enrollment_date: string;

  // Diagnosis
  primary_diagnosis: PrimaryDiagnosis | false;
  diagnosis_date?: string;
  diagnosed_by?: string;
  secondary_diagnosis_ids: OdooRef[];
  current_medications?: string;
  medical_alert: boolean;
  medical_alert_detail?: string;

  // Parent
  parent_user_id: OdooRef | false;
  parent_name?: string;
  parent_phone?: string;
  parent_email?: string;
  parent_relation?: ParentRelation;
  preferred_contact_method?: PreferredContact;
  receive_daily_report: boolean;

  // Team
  center_id: OdooRef;
  assigned_teacher_id: OdooRef;
  co_teacher_ids: OdooRef[];
  supervisor_id: OdooRef | false;

  // Learning profile
  learning_style?: LearningStyle;
  communication_level?: CommunicationLevel;
  attention_span?: number;

  // School
  school_name?: string;
  class_name?: string;
}

// ===== IEP Plan =====

export interface IepPlan {
  id: number;
  iep_period: string;
  start_date: string;
  end_date: string;
  status: IepPlanStatus;
  version_number: number;
  review_frequency: ReviewFrequency;
  parent_consent: boolean;
  supervisor_approved: boolean;

  student_id: OdooRef;
  assigned_teacher_id: OdooRef;
  supervisor_id: OdooRef | false;

  goal_ids: number[]; // ids only for list, load separately
}

// ===== IEP Goal =====

export interface IepGoal {
  id: number;
  name: string;
  goal_code: string;
  status: GoalStatus;
  priority: GoalPriority;
  goal_domain_id: OdooRef;

  start_date?: string;
  target_date: string;
  baseline_accuracy_pct: number;
  target_accuracy_pct: number;
  progress_pct: number;
  current_accuracy_pct: number;
  total_sessions: number;

  plan_id: OdooRef;
  objective_ids: number[];
  objective_count?: number;
}

// ===== IEP Objective =====

export interface IepObjectiveListItem {
  id: number;
  name: string;
  objective_code: string;
  status: ObjectiveStatus;
  goal_id: OdooRef;
  current_accuracy_pct: number;
  target_accuracy_pct: number;
  baseline_accuracy_pct: number;
  progress_pct: number;
  trend: Trend;
}

export interface IepObjectiveDetail {
  id: number;
  name: string;
  objective_code: string;
  description: string;
  status: ObjectiveStatus;

  goal_id: OdooRef;
  student_id: OdooRef;

  start_date?: string;
  target_date?: string;
  baseline_accuracy_pct: number;
  target_accuracy_pct: number;
  current_accuracy_pct: number;
  progress_pct: number;
  trend: Trend;

  consecutive_sessions_required: number;
  consecutive_sessions_achieved: number;
  total_sessions_worked: number;
  weight: number;

  last_session_date?: string;
  last_session_accuracy?: number;
  mastery_date?: string;
  is_overdue?: boolean;
}

// ===== Session =====

export interface SessionListItem {
  id: number;
  name: string; // session code e.g. "SL-2026-004"
  student_id: OdooRef;
  session_date: string;
  start_time: number; // Float e.g. 8.0 = 08:00
  end_time: number;
  location: SessionLocation;
  session_type: SessionType;
  session_purpose: SessionPurpose;
  status: SessionStatus;
  avg_accuracy?: number;
  result_count?: number;
}

export interface SessionDetail {
  id: number;
  name: string;
  student_id: OdooRef;
  teacher_id: OdooRef;
  session_date: string;
  start_time: number;
  end_time: number;
  duration: number;
  location: SessionLocation;
  session_type: SessionType;
  session_purpose: SessionPurpose;
  status: SessionStatus;

  // Observation fields (filled during eval)
  attendance?: Attendance;
  mood?: Mood;
  energy_level?: EnergyLevel;
  engagement_level?: EngagementLevel;
  overall_performance?: OverallPerformance;
  notes?: string;

  // Related objectives
  objective_ids: number[];

  // Results (populated when status = done)
  result_line_ids: SessionResult[];
  avg_accuracy?: number;
}

// ===== Session Result =====

export interface SessionResult {
  id: number;
  session_id: OdooRef;
  objective_id: OdooRef;

  correct_trials: number;
  total_trials: number;
  accuracy_pct: number;

  result_type: ResultType;
  prompt_level_used: PromptLevel;
  phase: Phase;
  teaching_method?: TeachingMethod;

  prompt_fading_noted: boolean;
  mastery_achieved: boolean;
  notes?: string;
}

// ===== Daily Report =====

export interface ReportListItem {
  id: number;
  name: string; // e.g. "DR-S001-20260407"
  student_id: OdooRef;
  report_date: string;
  status: ReportStatus;
  activity_summary?: string; // preview ~45 chars
}

export interface ReportDetail {
  id: number;
  name: string;
  student_id: OdooRef;
  session_log_id: OdooRef;
  report_date: string;
  teacher_id: OdooRef;
  status: ReportStatus;

  // Session info (related)
  session_duration?: number;
  overall_performance?: OverallPerformance;
  objectives_worked?: string;
  accuracy_summary?: string;

  // Content
  activity_summary?: string;
  achievements?: string;
  challenges_noted?: string;
  highlight_moment?: string;
  parent_action_guide?: string;
  next_session_preview?: string;
  teacher_note?: string; // internal, not sent to parent
}

// ===== User / Auth =====

export interface AuthUser {
  uid: number;
  session_id: string;
  role: UserRole;
  display_name: string;
  center_name?: string;
  center_id?: number;
}

export interface UserProfile {
  id: number;
  user_id: OdooRef;
  full_name: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: ProfileStatus;
  center_id: OdooRef;

  // Teacher-specific
  specialization?: string;
  certification?: string;
  years_experience?: number;
  max_students?: number;

  // Parent-specific
  parent_relation?: ParentRelation;
  preferred_contact?: PreferredContact;
}
