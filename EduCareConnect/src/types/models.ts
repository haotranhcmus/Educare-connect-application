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
  MeasurementType,
  PromptLevel,
  Phase,
  ResultPhase,
  TeachingMethod,
  ReportStatus,
  UserRole,
  ProfileStatus,
  ParentRelation,
  PreferredContact,
} from "@t/enums";

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
  /** Biệt danh — chỉ hiển thị cho giáo viên */
  nickname?: string;
  student_code: string;
  status: StudentStatus;
  primary_diagnosis: PrimaryDiagnosis | false;
  date_of_birth?: string;
  enrollment_date?: string;
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
  age_months?: number;
  gender: Gender;
  status: StudentStatus;
  /** Raw base64 image as returned by Odoo (or false when unset). */
  avatar?: string | false;
  /** Pre-built `data:` URL — populated by hooks/utility merges, not the API. */
  avatar_url?: string;
  /** Free-text secondary diagnosis used by ChildProfileTab. */
  secondary_diagnosis?: string;
  /** Free-text behaviour notes shown in the profile. */
  behavior_notes?: string;
  /** Free-text reinforcement preferences shown in the profile. */
  reinforcement_preferences?: string;

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
  maintenance_mode: boolean;
  closing_reason?: string;

  student_id: OdooRef;
  assigned_teacher_id: OdooRef;
  supervisor_id: OdooRef | false;

  goal_ids: number[]; // ids only for list, load separately
  /** Computed field (store=False) — chỉ có khi được request trong fields list */
  goal_count?: number;
}

// ===== IEP Goal =====

export interface IepGoal {
  id: number;
  name: string;
  goal_code: string;
  status: GoalStatus;
  priority: GoalPriority;
  goal_domain_id: OdooRef;

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
  description?: string;
  status: ObjectiveStatus;
  goal_id: OdooRef;
  domain_ids?: number[] | OdooRef[];
  current_accuracy_pct: number;
  target_accuracy_pct: number;
  baseline_accuracy_pct: number;
  progress_pct: number;
  trend: Trend;
  weight?: number;
  consecutive_sessions_required?: number;
  consecutive_sessions_achieved?: number;
  total_sessions_worked?: number;
  last_session_date?: string;
  last_session_accuracy?: number;
  mastery_date?: string;
  locked_accuracy_pct?: number;
  measurement_type: MeasurementType;
  target_prompt_level?: PromptLevel | false;
  target_duration_seconds?: number;
  baseline_count?: number;
  target_count?: number;
  implementation_steps?: string;
  materials_needed?: string;
  smart_specific?: string;
  smart_measurable?: string;
  smart_analysis?: string;
  smart_timebound?: string;
  difficulty_id?: OdooRef | false;
  suggested_prompt_level_id?: OdooRef | false;
}

export interface IepObjectiveDetail {
  id: number;
  name: string;
  objective_code: string;
  description: string;
  status: ObjectiveStatus;

  goal_id: OdooRef;
  student_id: OdooRef;

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
  locked_accuracy_pct?: number;

  measurement_type: MeasurementType;
  target_prompt_level?: PromptLevel | false;
  target_duration_seconds?: number;
  baseline_count?: number;
  target_count?: number;
  materials_needed?: string;
  implementation_steps?: string;
  baseline_description?: string;
  difficulty_id?: OdooRef | false;
  smart_specific?: string;
  smart_measurable?: string;
  smart_analysis?: string;
  smart_timebound?: string;
}

// ===== Session =====

export interface SessionListItem {
  id: number;
  name: string; // session code e.g. "SL-2026-004"
  student_id: OdooRef;
  student_name?: string; // plain name without [code] prefix
  /** Biệt danh học sinh — chỉ populate trong teacher flows */
  student_nickname?: string;
  student_avatar_url?: string;
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

export interface SessionLogDetail {
  id: number;
  name: string;
  student_id: OdooRef;
  student_name?: string; // plain name without [code] prefix
  student_avatar_url?: string;
  teacher_id: OdooRef;
  center_id?: OdooRef;
  session_date: string;
  start_time: number;
  end_time: number;
  duration: number;
  location: SessionLocation;
  session_type: SessionType;
  session_purpose: SessionPurpose;
  status: SessionStatus;
  avg_accuracy?: number;

  attendance?: Attendance;
  mood?: Mood;
  energy_level?: EnergyLevel;
  engagement_level?: EngagementLevel;
  overall_performance?: OverallPerformance;
  notes?: string;
  cancel_type?: string;
  cancel_notes?: string;

  result_line_ids?: number[];
  objective_ids?: number[];
}

// ===== Session Result =====

export interface SessionResultTrial {
  id: number;
  sequence: number;
  prompt_level: PromptLevel;
  weight: number;
}

export interface SessionResult {
  id: number;
  session_id: OdooRef;
  objective_id: OdooRef;
  session_date?: string;

  measurement_type: MeasurementType;
  score_pct: number;
  is_recorded: boolean;

  // accuracy
  correct_trials: number;
  total_trials: number;
  // prompt_level
  trial_ids?: number[];
  /** Resolved per-trial details (fetched separately, sorted by sequence). */
  trials?: SessionResultTrial[];
  // duration
  actual_duration_seconds?: number;
  // frequency
  actual_count?: number;

  phase: Phase;
  result_phase: ResultPhase;
  teaching_method?: TeachingMethod;

  mastery_achieved: boolean;
  notes?: string;
}

// ===== Daily Report =====

export interface ReportListItem {
  id: number;
  name: string; // e.g. "DR-S001-20260407"
  student_id: OdooRef;
  student_avatar_url?: string;
  /** Biệt danh học sinh — chỉ populate trong teacher flows */
  student_nickname?: string;
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
  /** IEP objective IDs evaluated in the source session — tap to drill down. */
  objective_ids?: number[];
  /** Plain-text fallback (legacy / email body). */
  objectives_worked?: string;
  accuracy_summary?: string;

  // Observation fields (moved from session to report)
  attendance?: string;
  mood?: string;
  energy_level?: string;
  engagement_level?: string;
  observation_notes?: string;

  // Photos
  photo_ids?: number[];

  // Content
  activity_summary?: string;
  achievements?: string;
  challenges_noted?: string;
  highlight_moment?: string;
  parent_action_guide?: string;
  next_session_preview?: string;
  teacher_note?: string; // internal, not sent to parent

  write_date?: string;
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

// ===== Parent-side shapes =====

/** Slim row returned by `fetchMyStudents` — child picker / list. */
export interface ParentStudent {
  id: number;
  name: string;
  student_code: string;
  status: StudentStatus;
  avatar: string | false;
  date_of_birth: string;
  age: number;
  gender: Gender;
  assigned_teacher_id: OdooRef | false;
  center_id: OdooRef;
}

/** Active IEP plan + nested goals for parent overview. */
export interface ParentIepPlanGoal {
  id: number;
  name: string;
  goal_domain_id: OdooRef | false;
  progress_pct: number;
  status: GoalStatus;
  objective_count?: number;
}

export interface ParentActiveIepPlan {
  id: number;
  iep_period: string;
  start_date: string;
  end_date: string;
  status: IepPlanStatus;
  version_number: number;
  supervisor_id: OdooRef | false;
  goals: ParentIepPlanGoal[];
}

/** Goal + objectives drill-down for parent progress view. */
export interface ParentObjectiveRow {
  id: number;
  name: string;
  description?: string;
  baseline_accuracy_pct: number;
  current_accuracy_pct: number;
  target_accuracy_pct: number;
  status: ObjectiveStatus;
  trend: Trend;
  last_session_date?: string;
  last_session_accuracy?: number;
}

export interface ParentGoalWithObjectives extends ParentIepPlanGoal {
  objectives: ParentObjectiveRow[];
}

/** Single row of the parent timetable list. */
export interface ParentTimetableSession {
  id: number;
  name: string;
  session_date: string;
  start_time: number;
  end_time: number;
  duration: number;
  location: SessionLocation;
  session_type: SessionType;
  session_purpose: SessionPurpose;
  status: SessionStatus;
  teacher_id: OdooRef | false;
  avg_accuracy?: number;
}

/** Latest completed session card on Parent Home. */
export interface ParentLatestSession {
  id: number;
  session_date: string;
  start_time: number;
  end_time: number;
  location: SessionLocation;
  status: SessionStatus;
}

/** Captured photo asset ready for upload. */
export interface PhotoAsset {
  uri: string;
  base64: string;
}
