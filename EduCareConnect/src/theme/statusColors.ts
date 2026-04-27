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
  // Session statuses
  draft: {
    label: "Nháp",
    color: "#F57F17",
    backgroundColor: "#FFF9C4",
    icon: "pencil-outline",
  },
  scheduled: {
    label: "Đã lên lịch",
    color: "#1565C0",
    backgroundColor: "#BBDEFB",
    icon: "calendar-check",
  },
  completed: {
    label: "Chờ nhập kết quả",
    color: "#E65100",
    backgroundColor: "#FFE0B2",
    icon: "clock-outline",
  },
  done: {
    label: "Đã xác nhận",
    color: "#2E7D32",
    backgroundColor: "#C8E6C9",
    icon: "check-circle",
  },
  cancelled: {
    label: "Đã hủy",
    color: "#424242",
    backgroundColor: "#E0E0E0",
    icon: "close-circle",
  },

  // IEP Plan statuses
  active: {
    label: "Đang hoạt động",
    color: "#2E7D32",
    backgroundColor: "#C8E6C9",
    icon: "play-circle",
  },
  ready_review: {
    label: "Chờ duyệt",
    color: "#F57F17",
    backgroundColor: "#FFF9C4",
    icon: "eye-outline",
  },
  supervisor_approved: {
    label: "Đã phê duyệt",
    color: "#1565C0",
    backgroundColor: "#BBDEFB",
    icon: "shield-check",
  },
  closed: {
    label: "Đã đóng",
    color: "#212121",
    backgroundColor: "#BDBDBD",
    icon: "lock",
  },

  // IEP Objective statuses
  not_started: {
    label: "Chưa bắt đầu",
    color: "#757575",
    backgroundColor: "#EEEEEE",
    icon: "minus-circle-outline",
  },
  in_progress: {
    label: "Đang tiến hành",
    color: "#2E7D32",
    backgroundColor: "#C8E6C9",
    icon: "progress-clock",
  },
  on_hold: {
    label: "Đang giữ",
    color: "#E65100",
    backgroundColor: "#FFE0B2",
    icon: "pause-circle",
  },
  mastered: {
    label: "Đã thành thạo",
    color: "#1B5E20",
    backgroundColor: "#A5D6A7",
    icon: "star-circle",
  },
  discontinued: {
    label: "Đã dừng",
    color: "#212121",
    backgroundColor: "#BDBDBD",
    icon: "stop-circle",
  },

  // Report statuses
  sent: {
    label: "Đã gửi",
    color: "#1565C0",
    backgroundColor: "#BBDEFB",
    icon: "send-check",
  },
  read: {
    label: "PH đã đọc",
    color: "#2E7D32",
    backgroundColor: "#C8E6C9",
    icon: "eye-check",
  },

  // Student statuses
  inactive: {
    label: "Không hoạt động",
    color: "#E65100",
    backgroundColor: "#FFE0B2",
    icon: "account-off",
  },
  graduated: {
    label: "Đã tốt nghiệp",
    color: "#6A1B9A",
    backgroundColor: "#E1BEE7",
    icon: "school",
  },
  transferred: {
    label: "Đã chuyển",
    color: "#4527A0",
    backgroundColor: "#D1C4E9",
    icon: "transfer",
  },
};

/**
 * Safe getter — trả về config mặc định nếu status không tồn tại
 */
export function getStatusConfig(status: string): StatusConfig {
  return (
    STATUS_COLORS[status] ?? {
      label: status,
      color: "#757575",
      backgroundColor: "#EEEEEE",
      icon: "help-circle-outline",
    }
  );
}
