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
 * Format date with day name
 * "2026-04-07" → "Thứ Hai, 07/04/2026"
 */
export function formatDateFull(dateStr: string): string {
  return dayjs(dateStr).format("dddd, DD/MM/YYYY");
}

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
