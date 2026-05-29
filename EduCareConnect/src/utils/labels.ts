export const LOCATION_LABELS: Record<string, string> = {
  center: "Tại trung tâm",
  home: "Tại nhà",
  school: "Tại trường",
  online: "Online",
};

export const SESSION_TYPE_LABELS: Record<string, string> = {
  individual: "1:1 Cá nhân",
  small_group: "Nhóm nhỏ",
  consultation: "Tư vấn",
};

/** Short variants of SESSION_TYPE_LABELS for compact UI like list cards. */
export const SESSION_TYPE_SHORT_LABELS: Record<string, string> = {
  individual: "Cá nhân",
  small_group: "Nhóm nhỏ",
  consultation: "Tư vấn",
};

export const SESSION_PURPOSE_LABELS: Record<string, string> = {
  intervention: "Can thiệp",
  maintenance: "Duy trì",
  generalization_probe: "Đánh giá tổng quát hóa",
  parent_training: "Hướng dẫn phụ huynh",
};

export const PROMPT_LEVEL_LABELS: Record<string, string> = {
  independent: "Độc lập hoàn toàn",
  gestural_visual: "Nhắc bằng cử chỉ / hình ảnh",
  verbal: "Nhắc bằng lời nói",
  physical: "Hỗ trợ thể chất",
  no_response: "Từ chối / Không phản hồi",
};

/** Short variants of PROMPT_LEVEL_LABELS for narrow columns / chips. */
export const PROMPT_LEVEL_SHORT_LABELS: Record<string, string> = {
  independent: "Độc lập hoàn toàn",
  gestural_visual: "Nhắc bằng cử chỉ / hình ảnh",
  verbal: "Nhắc bằng lời nói",
  physical: "Hỗ trợ thể chất",
  no_response: "Từ chối / Không phản hồi",
};

/** Weight (%) of each prompt level — mirrors backend TRIAL_PROMPT_WEIGHTS. */
export const PROMPT_LEVEL_WEIGHTS: Record<string, number> = {
  independent: 100,
  gestural_visual: 75,
  verbal: 50,
  physical: 25,
  no_response: 0,
};

/**
 * Map a 0–100 score into the prompt level whose support band it falls into.
 * Bands use a "floor" convention (each band represents the level the learner
 * has fully reached): pct=0 → no_response, (0,25] → physical, (25,50] →
 * verbal, (50,75] → gestural_visual, (75,100] → independent. Mirrors the
 * weights in PROMPT_LEVEL_WEIGHTS so band edges match mastery thresholds.
 */
export function pctToPromptLevel(pct: number): string {
  if (pct <= 0) return "no_response";
  if (pct <= 25) return "physical";
  if (pct <= 50) return "verbal";
  if (pct <= 75) return "gestural_visual";
  return "independent";
}

export const MEASUREMENT_TYPE_LABELS: Record<string, string> = {
  accuracy: "Độ chính xác (đúng / tổng số lần)",
  prompt_level: "Mức độ hỗ trợ (theo từng lần thử)",
  duration: "Thời lượng (giây)",
  frequency_increase: "Tần suất - Tăng hành vi tích cực",
  frequency_decrease: "Tần suất - Giảm hành vi tiêu cực",
};

export const PHASE_LABELS: Record<string, string> = {
  baseline: "Cơ sở ban đầu",
  intervention: "Can thiệp",
  maintenance: "Duy trì",
  generalization: "Tổng quát hóa",
};

export const MOOD_LABELS: Record<string, string> = {
  very_good: "Vui",
  good: "Tốt",
  neutral: "Bình thường",
  difficult: "Buồn",
  very_difficult: "Khó chịu",
};

export const ENERGY_LABELS: Record<string, string> = {
  high: "Cao",
  normal: "Bình thường",
  low: "Thấp",
};

export const ENGAGEMENT_LABELS: Record<string, string> = {
  highly_engaged: "Rất tập trung",
  engaged: "Tham gia",
  somewhat_engaged: "Khá tập trung",
  disengaged: "Phân tâm",
};

export const PERFORMANCE_LABELS: Record<string, string> = {
  very_poor: "Rất yếu",
  poor: "Cần cải thiện",
  fair: "Khá",
  good: "Tốt",
  excellent: "Xuất sắc",
};

export const ATTENDANCE_LABELS: Record<string, string> = {
  present: "Có mặt",
  absent: "Vắng",
};

/** Cancel-reason labels used on session detail when status === 'cancelled'. */
export const CANCEL_TYPE_LABELS: Record<string, string> = {
  // Teacher / Center reasons
  teacher_sick: "Giáo viên bệnh",
  teacher_personal: "Giáo viên bận việc cá nhân",
  center_rescheduled: "Trung tâm thay đổi lịch",
  cancelled_center: "Huỷ bởi trung tâm",
  // Family / Parent reasons
  child_sick: "Con bệnh",
  family_event: "Gia đình có việc",
  family_travel: "Đi du lịch / đi xa",
  cancelled_family: "Huỷ bởi gia đình",
};

/** Cancel options shown to teachers in the cancel modal. */
export const TEACHER_CANCEL_OPTIONS: { value: string; label: string }[] = [
  { value: "teacher_sick", label: "Giáo viên bệnh" },
  { value: "teacher_personal", label: "Giáo viên bận việc cá nhân" },
  { value: "center_rescheduled", label: "Trung tâm thay đổi lịch" },
  { value: "cancelled_center", label: "Trung tâm hủy" },
];

/** Cancel options shown to parents in the cancel modal. */
export const PARENT_CANCEL_OPTIONS: { value: string; label: string }[] = [
  { value: "child_sick", label: "Con bệnh" },
  { value: "family_event", label: "Gia đình có việc" },
  { value: "family_travel", label: "Đi du lịch / đi xa" },
  { value: "cancelled_family", label: "Gia đình hủy" },
];

export const DIAGNOSIS_LABELS: Record<string, string> = {
  autism: "Rối loạn phổ tự kỷ (ASD)",
  adhd: "ADHD",
  developmental_delay: "Chậm phát triển",
  speech_delay: "Chậm ngôn ngữ",
  intellectual_disability: "Khuyết tật trí tuệ",
  cerebral_palsy: "Bại não",
  down_syndrome: "Hội chứng Down",
  other: "Khác",
};

export const GENDER_LABELS: Record<string, string> = {
  male: "Nam",
  female: "Nữ",
  other: "Khác",
};

export const REVIEW_FREQUENCY_LABELS: Record<string, string> = {
  weekly: "Hàng tuần",
  biweekly: "Hai tuần một lần",
  monthly: "Hàng tháng",
  quarterly: "Hàng quý",
};

/**
 * Observation-field label namespaces. Used by report-detail screens to look
 * up the right Vietnamese label for any of the four obs enums.
 *
 * Replaces multiple inline OBS_LABELS definitions.
 */
export const OBS_LABELS = {
  attendance: ATTENDANCE_LABELS,
  mood: MOOD_LABELS,
  energy_level: ENERGY_LABELS,
  engagement_level: ENGAGEMENT_LABELS,
} as const;

export type ObsField = keyof typeof OBS_LABELS;

/**
 * Resolve a single observation value to its display label, falling back to
 * the raw value if the enum isn't mapped.
 */
export function obsLabel(
  field: ObsField,
  value: string | undefined | null | false,
): string {
  if (!value) return "—";
  return OBS_LABELS[field][value] ?? value;
}

/**
 * Convert a label-map (Record<value, label>) into the shape expected by
 * the form Picker component (`{ value, label }[]`).
 *
 * Preserves insertion order, which mirrors the visual order each label-map
 * was authored in.
 */
export function toPickerOptions<V extends string>(
  labels: Record<V, string>,
): { value: V; label: string }[] {
  return (Object.keys(labels) as V[]).map((value) => ({
    value,
    label: labels[value],
  }));
}
