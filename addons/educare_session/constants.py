"""
Global constants for educare_session module.

These constants are defined at module level to allow sharing
across multiple models and for easier maintenance.
"""

# Prompt/Support levels in ABA training
# Order matters: index 0 (independent) = best, index 4 (full_physical) = needs most support
PROMPT_LEVELS = [
    ("independent", "Độc lập"),
    ("verbal_prompt", "Gợi ý bằng lời"),
    ("gestural_prompt", "Gợi ý bằng cử chỉ"),
    ("partial_physical", "Hỗ trợ thể chất một phần"),
    ("full_physical", "Hỗ trợ thể chất toàn phần"),
]

# Extracted keys in order - for index-based comparison
# used_idx <= max_idx => mastery achieved
# used_idx > max_idx => requires more support than allowed
PROMPT_ORDER = [key for key, _ in PROMPT_LEVELS]

# Result/data collection types in ABA
RESULT_TYPES = [
    ("trial_by_trial", "Từng trial"),
    ("probe", "Thăm dò"),
    ("whole_task", "Toàn bộ nhiệm vụ"),
    ("partial_interval", "Khoảng thời gian một phần"),
    ("momentary_time_sample", "Lấy mẫu thời điểm"),
]

# Objective-level ABA phase at the moment data is collected.
RESULT_PHASES = [
    ("baseline", "Cơ sở"),
    ("intervention", "Can thiệp"),
    ("maintenance", "Duy trì"),
    ("generalization", "Khái quát hóa"),
]

# Teaching method used for a specific objective inside one session.
TEACHING_METHODS = [
    ("dtt", "Luyện tập theo trial rời rạc (DTT)"),
    ("net", "Dạy học trong môi trường tự nhiên (NET)"),
    ("task_analysis", "Phân tích nhiệm vụ"),
    ("incidental", "Dạy học ngẫu nhiên"),
    ("errorless", "Học không lỗi"),
]

# Teacher-rated reinforcement effectiveness for that objective result.
REINFORCEMENT_EFFECTIVENESS = [
    ("high", "Cao - Học viên phản ứng mạnh"),
    ("medium", "Trung bình - Học viên phản ứng vừa phải"),
    ("low", "Thấp - Học viên phản ứng hạn chế"),
]

# Cancel type for session cancellation
CANCEL_TYPES = [
    ("cancelled_center", "Trung tâm hủy"),
    ("cancelled_family", "Gia đình hủy"),
]

# Session status workflow
SESSION_STATUS = [
    ("draft", "Bản nháp"),
    ("scheduled", "Đã lên lịch"),
    ("completed", "Đã hoàn thành"),
    ("done", "Đã xét duyệt"),
    ("cancelled", "Đã hủy"),
]

LOCATIONS = [
    ("center", "Tại trung tâm"),
    ("home", "Tại nhà"),
    ("school", "Tại trường"),
    ("online", "Trực tuyến"),
]

SESSION_TYPES = [
    ("individual", "Cá nhân (1:1)"),
    ("small_group", "Nhóm nhỏ (2-4 học viên)"),
    ("consultation", "Tư vấn"),
]

# Session purpose controls objective selection policy.
SESSION_PURPOSES = [
    ("intervention", "Can thiệp"),
    ("maintenance_probe", "Kiểm tra duy trì"),
    ("generalization_probe", "Kiểm tra khái quát hóa"),
    ("parent_training", "Đào tạo phụ huynh"),
]

HOME_PRACTICE_STATUS = [
    ("yes", "Hoàn thành đầy đủ"),
    ("partial", "Hoàn thành một phần"),
    ("no", "Chưa hoàn thành"),
    ("not_assigned", "Chưa được giao"),
]
