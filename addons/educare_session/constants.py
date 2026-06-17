"""
Global constants for educare_session module.

These constants are defined at module level to allow sharing
across multiple models and for easier maintenance.
"""

# Prompt/Support levels for per-trial data collection (measurement_type = 'prompt_level').
# Each level maps to a weight; trial score = weight, objective score = avg of trial weights.
TRIAL_PROMPT_LEVELS = [
    ("independent", "Độc lập hoàn toàn"),
    ("gestural_visual", "Nhắc bằng cử chỉ / hình ảnh"),
    ("verbal", "Nhắc bằng lời nói"),
    ("physical", "Hỗ trợ thể chất"),
    ("no_response", "Từ chối / Không phản hồi"),
]

TRIAL_PROMPT_WEIGHTS = {
    "independent": 100,
    "gestural_visual": 75,
    "verbal": 50,
    "physical": 25,
    "no_response": 0,
}

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

# Cancel types — all possible values stored in the database
CANCEL_TYPES = [
    # Teacher / Center reasons
    ("teacher_sick", "Giáo viên bệnh"),
    ("teacher_personal", "Giáo viên bận việc cá nhân"),
    ("center_rescheduled", "Trung tâm thay đổi lịch"),
    ("cancelled_center", "Trung tâm hủy"),
    # Family / Parent reasons
    ("child_sick", "Con bệnh"),
    ("family_event", "Gia đình có việc"),
    ("family_travel", "Đi du lịch / đi xa"),
    ("cancelled_family", "Gia đình hủy"),
]

# Subsets shown in each cancel UI context
TEACHER_CANCEL_TYPES = [
    ("teacher_sick", "Giáo viên bệnh"),
    ("teacher_personal", "Giáo viên bận việc cá nhân"),
    ("center_rescheduled", "Trung tâm thay đổi lịch"),
    ("cancelled_center", "Trung tâm hủy"),
]

PARENT_CANCEL_TYPES = [
    ("child_sick", "Con bệnh"),
    ("family_event", "Gia đình có việc"),
    ("family_travel", "Đi du lịch / đi xa"),
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

SESSION_TYPES = [
    ("individual", "Cá nhân (1:1)"),
    ("small_group", "Nhóm nhỏ (2-4 học viên)"),
    ("consultation", "Tư vấn"),
]

# Session purpose controls objective selection policy.
SESSION_PURPOSES = [
    ("intervention", "Can thiệp"),
    ("maintenance", "Duy trì"),
    ("mixed", "Can thiệp có duy trì"),
]

HOME_PRACTICE_STATUS = [
    ("yes", "Hoàn thành đầy đủ"),
    ("partial", "Hoàn thành một phần"),
    ("no", "Chưa hoàn thành"),
    ("not_assigned", "Chưa được giao"),
]
