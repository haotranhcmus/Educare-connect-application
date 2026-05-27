export interface StatusConfig {
  label: string;
  color: string;
  backgroundColor: string;
  icon?: string;
}

/**
 * Centralized status → visual config mapping.
 * Dùng cho StatusBadge component và mọi nơi cần hiển thị status.
 *
 * Quy ước màu:
 * - Xám: trạng thái khởi tạo / chưa xử lý
 * - Vàng: đang chờ / pending
 * - Xanh dương: đã xử lý một phần
 * - Xanh lá: hoàn thành / active
 * - Cam: tạm dừng / cần chú ý
 * - Đỏ: nguy hiểm / lỗi
 * - Đen: đã đóng / hủy
 */
export const STATUS_COLORS: Record<string, StatusConfig> = {
  // ─── Session statuses ────────────────────────────────────────────────────────
  draft: {
    label: "Nháp",
    color: "#616161", // Xám — chưa xử lý / khởi tạo
    backgroundColor: "#F5F5F5",
    icon: "pencil-outline",
  },
  scheduled: {
    label: "Đã lên lịch",
    color: "#1565C0", // Xanh dương — đã xử lý một phần
    backgroundColor: "#BBDEFB",
    icon: "calendar-check",
  },
  completed: {
    label: "Chờ nhập kết quả",
    color: "#F57F17", // Vàng — đang chờ / pending
    backgroundColor: "#FFF9C4",
    icon: "clock-outline",
  },
  done: {
    label: "Đã dạy",
    color: "#2E7D32", // Xanh lá — hoàn thành
    backgroundColor: "#C8E6C9",
    icon: "check-circle",
  },
  cancelled: {
    label: "Đã hủy",
    color: "#C62828", // Đỏ — hủy / nguy hiểm
    backgroundColor: "#FFCDD2",
    icon: "close-circle",
  },

  // ─── IEP Plan statuses ───────────────────────────────────────────────────────
  active: {
    label: "Đang hoạt động",
    color: "#1565C0", // Xanh dương — đang hoạt động
    backgroundColor: "#BBDEFB",
    icon: "play-circle",
  },
  // Use "iep_completed" key to avoid collision with session "completed" status
  iep_completed: {
    label: "Hoàn thành",
    color: "#2E7D32", // Xanh lá — đã hoàn thành kỳ IEP
    backgroundColor: "#C8E6C9",
    icon: "trophy-outline",
  },
  ready_review: {
    label: "Chờ duyệt",
    color: "#F57F17", // Vàng — pending / chờ
    backgroundColor: "#FFF9C4",
    icon: "eye-outline",
  },
  supervisor_approved: {
    label: "Đã phê duyệt",
    color: "#1565C0", // Xanh dương — đã xử lý
    backgroundColor: "#BBDEFB",
    icon: "shield-check",
  },
  closed: {
    label: "Đã đóng",
    color: "#212121", // Đen — đã đóng / kết thúc vĩnh viễn
    backgroundColor: "#BDBDBD",
    icon: "lock",
  },

  // ─── IEP Objective statuses ──────────────────────────────────────────────────
  not_started: {
    label: "Chưa bắt đầu",
    color: "#616161", // Xám — chưa xử lý
    backgroundColor: "#EEEEEE",
    icon: "minus-circle-outline",
  },
  in_progress: {
    label: "Đang tiến hành",
    color: "#1565C0", // Xanh dương — đang xử lý một phần
    backgroundColor: "#BBDEFB",
    icon: "progress-clock",
  },
  on_hold: {
    label: "Đang giữ",
    color: "#E65100", // Cam — tạm dừng / cần chú ý
    backgroundColor: "#FFE0B2",
    icon: "pause-circle",
  },
  mastered: {
    label: "Đã thành thạo",
    color: "#2E7D32", // Xanh lá đậm — hoàn thành xuất sắc
    backgroundColor: "#C8E6C9",
    icon: "star-circle",
  },
  discontinued: {
    label: "Đã dừng",
    color: "#C62828", // Đỏ — dừng hẳn / tiêu cực
    backgroundColor: "#FFCDD2",
    icon: "stop-circle",
  },

  // ─── Report statuses ─────────────────────────────────────────────────────────
  sent: {
    label: "Đã gửi",
    color: "#1565C0", // Xanh dương — đã xử lý
    backgroundColor: "#BBDEFB",
    icon: "send-check",
  },
  read: {
    label: "Phụ huynh đã đọc",
    color: "#2E7D32", // Xanh lá — hoàn thành
    backgroundColor: "#C8E6C9",
    icon: "eye-check",
  },

  // ─── Student statuses ────────────────────────────────────────────────────────
  inactive: {
    label: "Không hoạt động",
    color: "#C62828", // Đỏ — trạng thái tiêu cực / cần chú ý
    backgroundColor: "#FFCDD2",
    icon: "account-off",
  },
  graduated: {
    label: "Đã tốt nghiệp",
    color: "#6A1B9A", // Tím — đặc biệt / tích cực
    backgroundColor: "#E1BEE7",
    icon: "school",
  },
  transferred: {
    label: "Đã chuyển",
    color: "#4527A0", // Tím đậm — trạng thái trung tính đặc biệt
    backgroundColor: "#D1C4E9",
    icon: "transfer",
  },
};

export function getStatusConfig(status: string): StatusConfig {
  return (
    STATUS_COLORS[status] ?? {
      label: status,
      color: "#616161",
      backgroundColor: "#F5F5F5",
    }
  );
}
