/**
 * Decorative color palettes — colors that are NOT status indicators.
 *
 * For status colors (session state, IEP state, report state, student state),
 * use `STATUS_COLORS` from `./statusColors`.
 *
 * These palettes drive avatar fallbacks, the colored "content bubbles" in
 * report screens, performance badges, and stat cards on the home screens.
 */

import type { MaterialCommunityIcons } from "@expo/vector-icons";

type MciName = keyof typeof MaterialCommunityIcons.glyphMap;

/**
 * Avatar fallback colors when no photo is available.
 * Hashed by display name so the same person gets the same color.
 */
export const AVATAR_PALETTE = [
  "#2E7D32",
  "#1565C0",
  "#6A1B9A",
  "#C62828",
  "#00838F",
  "#EF6C00",
  "#4527A0",
  "#AD1457",
] as const;

/**
 * "Overall performance" badge config used in report cards, session picker,
 * and report detail. Replaces 4 local PERF_CONFIG / PERF_MAP definitions.
 */
export interface PerformanceMeta {
  label: string;
  color: string;
  bg: string;
  icon: MciName;
}

export const PERFORMANCE_CONFIG: Record<string, PerformanceMeta> = {
  excellent: {
    label: "Xuất sắc",
    color: "#1B5E20",
    bg: "#E8F5E9",
    icon: "star",
  },
  good: {
    label: "Tốt",
    color: "#1565C0",
    bg: "#E3F2FD",
    icon: "thumb-up",
  },
  fair: {
    label: "Trung bình",
    color: "#E65100",
    bg: "#FFF3E0",
    icon: "minus-circle",
  },
  average: {
    label: "Trung bình",
    color: "#E65100",
    bg: "#FFF3E0",
    icon: "minus-circle",
  },
  needs_support: {
    label: "Cần hỗ trợ",
    color: "#B71C1C",
    bg: "#FFEBEE",
    icon: "heart-pulse",
  },
  poor: {
    label: "Kém",
    color: "#B71C1C",
    bg: "#FFEBEE",
    icon: "heart-pulse",
  },
};

/**
 * Report-detail hero badge palette. These are SOFTER than the chip-style
 * STATUS_COLORS — kept separate so the hero section keeps its current
 * "calmer" look. If you want to unify with STATUS_COLORS, do it in the
 * screen-refactor phase, not here.
 */
export interface StatusHeroMeta {
  label: string;
  color: string;
  bg: string;
  icon: MciName;
}

export const REPORT_STATUS_HERO_CONFIG: Record<string, StatusHeroMeta> = {
  draft: {
    label: "Nháp",
    color: "#757575",
    bg: "#F5F5F5",
    icon: "file-outline",
  },
  sent: {
    label: "Đã gửi",
    color: "#1565C0",
    bg: "#E3F2FD",
    icon: "send-check",
  },
  read: {
    label: "Đã đọc",
    color: "#2E7D32",
    bg: "#E8F5E9",
    icon: "eye-check",
  },
};

/**
 * Style tokens for the "Chưa có báo cáo" warning badge shown on session
 * list cards when a completed session has no report yet.
 */
export const NO_REPORT_BADGE = {
  color: "#E65100",
  bg: "#FFF3E0",
  border: "#FFCC02",
} as const;

/**
 * Stat-card backgrounds used on home screens for the "today / week / month"
 * tiles. Kept as named tokens rather than scattered inline hex.
 */
export const STAT_TILE_COLORS = {
  blue: { color: "#1565C0", bg: "#E3F2FD" },
  green: { color: "#2E7D32", bg: "#E8F5E9" },
  purple: { color: "#6A1B9A", bg: "#F3E5F5" },
  orange: { color: "#E65100", bg: "#FFF3E0" },
} as const;
