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
