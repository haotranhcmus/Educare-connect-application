import dayjs from "dayjs";
import "dayjs/locale/vi";

dayjs.locale("vi");

/**
 * Format Odoo date string → Vietnamese display
 * "2026-04-07" → "07/04/2026"
 */
export function formatDate(dateStr: string | false | undefined): string {
  if (!dateStr) return "—";
  return dayjs(dateStr).format("DD/MM/YYYY");
}

/**
 * Format Odoo datetime string → "DD/MM/YYYY HH:mm" display.
 * Empty / falsy input returns "".
 */
export function formatDateTime(
  dtStr: string | false | undefined | null,
): string {
  if (!dtStr) return "";
  return dayjs(dtStr).format("DD/MM/YYYY HH:mm");
}

/**
 * Format date with day name
 * "2026-04-07" → "Thứ Hai, 07/04/2026"
 */
export function formatDateFull(dateStr: string): string {
  return dayjs(dateStr).format("dddd, DD/MM/YYYY");
}

/**
 * Format date with short Vietnamese weekday prefix.
 * "2026-04-07" → "T3 07/04"
 */
export function formatDateShort(dateStr: string): string {
  const d = dayjs(dateStr);
  const days = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  return `${days[d.day()]} ${d.format("DD/MM")}`;
}

/**
 * Format date with full Vietnamese weekday appended.
 * "2026-04-07" → "07/04/2026  Thứ Ba"
 */
export function formatDateWithWeekday(dateStr: string): string {
  const d = dayjs(dateStr);
  return `${d.format("DD/MM/YYYY")}  ${VI_DAY_NAMES[d.day()]}`;
}

/**
 * Format date as long Vietnamese weekday + day/month (no year).
 * "2026-04-07" → "Thứ Ba 07/04"
 */
export function formatWeekdayDayMonth(dateStr: string): string {
  const d = dayjs(dateStr);
  return `${VI_DAY_NAMES[d.day()]} ${d.format("DD/MM")}`;
}

const VI_DAY_NAMES = [
  "Chủ Nhật",
  "Thứ Hai",
  "Thứ Ba",
  "Thứ Tư",
  "Thứ Năm",
  "Thứ Sáu",
  "Thứ Bảy",
];

/**
 * Odoo Float time → HH:mm string
 * 8.5 → "08:30"
 * 14.0 → "14:00"
 */
export function formatFloatTime(floatTime: number): string {
  const hours = Math.floor(floatTime);
  const minutes = Math.round((floatTime - hours) * 60);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

/**
 * Float duration → "X giờ Y phút" hoặc "X phút"
 */
export function formatDuration(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `${m} phút`;
  if (m === 0) return `${h} giờ`;
  return `${h} giờ ${m} phút`;
}

/**
 * Format percentage
 * 72.5 → "73%"
 */
export function formatPercent(value: number | undefined | false): string {
  if (value === undefined || value === false) return "—";
  return `${Math.round(value)}%`;
}

/**
 * Check if date is today
 */
export function isToday(dateStr: string): boolean {
  return dayjs(dateStr).isSame(dayjs(), "day");
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + "...";
}
