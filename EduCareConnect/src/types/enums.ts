// ===== Student =====
export type StudentStatus = "active" | "inactive" | "graduated" | "transferred";
export type Gender = "male" | "female" | "other";
export type PrimaryDiagnosis =
  | "autism"
  | "adhd"
  | "developmental_delay"
  | "speech_delay"
  | "intellectual_disability"
  | "cerebral_palsy"
  | "down_syndrome"
  | "other";
export type LearningStyle = "visual" | "auditory" | "kinesthetic" | "mixed";
export type CommunicationLevel =
  | "non_verbal"
  | "single_word"
  | "phrase"
  | "sentence"
  | "fluent";
export type CognitiveLevel = "severe" | "moderate" | "mild" | "age_appropriate";
export type MotorSkillLevel =
  | "severe_delay"
  | "moderate_delay"
  | "mild_delay"
  | "age_appropriate";
export type SocialInteractionLevel =
  | "avoidant"
  | "passive"
  | "responsive"
  | "initiating";
export type EmotionalRegulation = "poor" | "developing" | "adequate" | "good";

// ===== IEP Plan =====
export type IepPlanStatus =
  | "draft"
  | "ready_review"
  | "supervisor_approved"
  | "active"
  | "closed";
export type ReviewFrequency = "weekly" | "biweekly" | "monthly" | "quarterly";

// ===== IEP Goal =====
export type GoalStatus = "draft" | "active" | "achieved" | "discontinued";
export type GoalPriority = "low" | "medium" | "high" | "critical";

// ===== IEP Objective =====
export type ObjectiveStatus =
  | "not_started"
  | "in_progress"
  | "on_hold"
  | "mastered"
  | "discontinued";
export type Trend =
  | "improving"
  | "stable"
  | "declining"
  | "stagnant"
  | "insufficient_data";

// ===== Session =====
export type SessionStatus = "draft" | "scheduled" | "completed" | "done";
export type SessionLocation = "center" | "home" | "school" | "online";
export type SessionType = "individual" | "small_group" | "consultation";
export type SessionPurpose =
  | "intervention"
  | "maintenance_probe"
  | "generalization_probe"
  | "parent_training";
export type Attendance =
  | "present"
  | "absent_excused"
  | "absent_unexcused"
  | "cancelled_center"
  | "cancelled_family";
export type Mood =
  | "very_good"
  | "good"
  | "neutral"
  | "difficult"
  | "very_difficult";
export type EnergyLevel = "high" | "normal" | "low";
export type EngagementLevel =
  | "highly_engaged"
  | "engaged"
  | "somewhat_engaged"
  | "disengaged";
export type OverallPerformance = "excellent" | "good" | "fair" | "poor";

// ===== Session Result =====
export type PromptLevel =
  | "independent"
  | "verbal_prompt"
  | "gestural_prompt"
  | "partial_physical"
  | "full_physical";
export type ResultType =
  | "trial_by_trial"
  | "probe"
  | "whole_task"
  | "partial_interval"
  | "momentary_time_sample";
export type Phase =
  | "baseline"
  | "intervention"
  | "maintenance"
  | "generalization";
export type TeachingMethod =
  | "dtt"
  | "net"
  | "task_analysis"
  | "incidental"
  | "errorless";
export type ReinforcementEffectiveness = "high" | "medium" | "low";

// ===== Report =====
export type ReportStatus = "draft" | "sent" | "read";
export type ReportType = "daily" | "weekly_summary";

// ===== User =====
export type UserRole = "admin" | "supervisor" | "teacher" | "parent";
export type ProfileStatus = "active" | "inactive" | "suspended";
export type ParentRelation = "father" | "mother" | "guardian" | "other";
export type PreferredContact = "email" | "phone" | "zalo" | "sms";
