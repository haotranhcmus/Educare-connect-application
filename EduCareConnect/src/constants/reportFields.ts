/**
 * Field metadata for the report-create form and report-detail display.
 *
 * Previously this config was duplicated in three places:
 *   - ReportCreateScreen.tsx       (form field order + icon + placeholder)
 *   - ReportDetailScreen.tsx       (display sections + colored bubble)
 *   - ParentReportDetailScreen.tsx (parent-side display, hides teacher_note)
 *
 * Centralizing here so adding a new report field is a single-place change.
 */

import type { MaterialCommunityIcons } from "@expo/vector-icons";

type MciName = keyof typeof MaterialCommunityIcons.glyphMap;

/**
 * Free-text report fields that the teacher fills in. The order of this
 * array drives both the form input order and the read-only display order.
 */
export interface ReportFieldDef {
  /** Odoo field name on `educare.daily.report`. */
  name:
    | "activity_summary"
    | "achievements"
    | "challenges_noted"
    | "highlight_moment"
    | "parent_action_guide"
    | "next_session_preview"
    | "teacher_note";
  /** Vietnamese label shown above the input / section. */
  label: string;
  /** MaterialCommunityIcons glyph. */
  icon: MciName;
  /** Placeholder text (form view only). */
  placeholder: string;
  /** Number of TextInput rows (form view only). */
  lines: number;
  /** Required validation flag (form view only). */
  required?: boolean;
  /** Decorative accent color for the read-only display card. */
  color: string;
  /** If true, the field is internal-only and parents should not see it. */
  internal?: boolean;
}

export const REPORT_FIELDS: ReportFieldDef[] = [
  {
    name: "activity_summary",
    label: "Tóm tắt hoạt động",
    icon: "clipboard-text-outline",
    placeholder: "Hôm nay bé đã làm gì trong buổi học?",
    lines: 4,
    required: true,
    color: "#1565C0",
  },
  {
    name: "achievements",
    label: "Thành tích nổi bật",
    icon: "star-outline",
    placeholder: "Bé đã đạt được gì đáng khen?",
    lines: 3,
    color: "#F9A825",
  },
  {
    name: "challenges_noted",
    label: "Điểm cần tiếp tục hỗ trợ",
    icon: "lightbulb-outline",
    placeholder: "Những điểm cần tiếp tục luyện tập...",
    lines: 3,
    color: "#E65100",
  },
  {
    name: "highlight_moment",
    label: "Khoảnh khắc đáng nhớ",
    icon: "heart-outline",
    placeholder: "Một khoảnh khắc đặc biệt trong buổi học...",
    lines: 2,
    color: "#C62828",
  },
  {
    name: "parent_action_guide",
    label: "Hướng dẫn luyện tập tại nhà",
    icon: "home-heart",
    placeholder: "Phụ huynh có thể hỗ trợ bé bằng cách...",
    lines: 3,
    color: "#2E7D32",
  },
  {
    name: "next_session_preview",
    label: "Nội dung buổi học tới",
    icon: "calendar-arrow-right",
    placeholder: "Buổi học tiếp theo chúng ta sẽ...",
    lines: 2,
    color: "#6A1B9A",
  },
  {
    name: "teacher_note",
    label: "Ghi chú nội bộ (chỉ giáo viên thấy)",
    icon: "lock-outline",
    placeholder: "Ghi chú dành riêng cho giáo viên...",
    lines: 2,
    color: "#546E7A",
    internal: true,
  },
];

/** Subset shown to parents (omits `internal: true` fields). */
export const REPORT_FIELDS_PARENT: ReportFieldDef[] = REPORT_FIELDS.filter(
  (f) => !f.internal,
);

export type ReportFieldName = ReportFieldDef["name"];
