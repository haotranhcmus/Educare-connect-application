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
  maintenance_probe: "Đánh giá duy trì",
  generalization_probe: "Đánh giá tổng quát hóa",
  parent_training: "Hướng dẫn phụ huynh",
};

export const PROMPT_LEVEL_LABELS: Record<string, string> = {
  independent: "Độc lập",
  verbal_prompt: "Gợi ý ngôn ngữ",
  gestural_prompt: "Gợi ý cử chỉ",
  partial_physical: "Hỗ trợ thể chất một phần",
  full_physical: "Hỗ trợ thể chất hoàn toàn",
};

/** Short variants of PROMPT_LEVEL_LABELS for narrow columns / chips. */
export const PROMPT_LEVEL_SHORT_LABELS: Record<string, string> = {
  independent: "Độc lập",
  verbal_prompt: "Nhắc lời",
  gestural_prompt: "Cử chỉ",
  partial_physical: "Một phần",
  full_physical: "Hoàn toàn",
};

export const RESULT_TYPE_LABELS: Record<string, string> = {
  trial_by_trial: "Trial-by-Trial",
  probe: "Probe",
  whole_task: "Whole Task",
  partial_interval: "Khoảng thời gian một phần",
  momentary_time_sample: "Khoảng thời điểm",
};

export const PHASE_LABELS: Record<string, string> = {
  baseline: "Cơ sở ban đầu",
  intervention: "Can thiệp",
  maintenance: "Duy trì",
  generalization: "Tổng quát hóa",
};

export const MOOD_LABELS: Record<string, string> = {
  very_good: "Rất tốt",
  good: "Tốt",
  neutral: "Bình thường",
  difficult: "Khó khăn",
  very_difficult: "Rất khó khăn",
};

export const ENERGY_LABELS: Record<string, string> = {
  high: "Cao",
  normal: "Bình thường",
  low: "Thấp",
};

export const ENGAGEMENT_LABELS: Record<string, string> = {
  highly_engaged: "Rất tập trung",
  engaged: "Tham gia",
  somewhat_engaged: "Có tham gia",
  disengaged: "Không tập trung",
};

export const PERFORMANCE_LABELS: Record<string, string> = {
  excellent: "Xuất sắc",
  good: "Tốt",
  fair: "Trung bình",
  poor: "Cần hỗ trợ",
};

export const ATTENDANCE_LABELS: Record<string, string> = {
  present: "Có mặt",
  absent_excused: "Vắng có phép",
  absent_unexcused: "Vắng không phép",
  cancelled_center: "Huỷ bởi trung tâm",
  cancelled_family: "Huỷ bởi gia đình",
};

/** Cancel-reason labels used on session detail when status === 'cancelled'. */
export const CANCEL_TYPE_LABELS: Record<string, string> = {
  cancelled_center: "Huỷ bởi trung tâm",
  cancelled_family: "Huỷ bởi gia đình",
};

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
