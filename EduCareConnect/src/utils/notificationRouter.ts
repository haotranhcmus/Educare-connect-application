import type { UserRole } from "@t";

export interface RouterTarget {
  /**
   * Name of the screen to navigate to when a notification row is tapped.
   * For parent role the screen lives in ParentHomeStack; for teacher it
   * lives in TeacherRootStack (resolved by React Navigation's lookup).
   */
  screen: string;
  params: Record<string, unknown>;
}

interface PushPayload {
  type?: string;
  ref_model?: string | null;
  ref_id?: number | null;
  /** Notification title — used to extract counterpart name when icon_name absent. */
  title?: string;
  /** Pre-resolved chat counterpart fields from /api/notifications/list. */
  icon_avatar?: string | null;
  icon_name?: string | null;
}

/**
 * Backend creates chat notifications with title "Tin nhắn mới từ <name>".
 * Pull the name back out so we can pass it to ChatRoom without an extra API
 * round-trip. Returns "Cuộc trò chuyện" when the pattern doesn't match.
 */
function extractCounterpartName(title?: string): string {
  if (!title) return "Cuộc trò chuyện";
  const match = title.match(/^Tin nhắn mới từ\s+(.+)$/);
  return match ? match[1].trim() : title;
}

function chatRoomTarget(payload: PushPayload): RouterTarget {
  // Prefer the serialized counterpart fields (richer, exact). Fall back
  // to parsing the title for push-notification taps where the payload only
  // carries type/ref_model/ref_id.
  return {
    screen: "ChatRoom",
    params: {
      conversationId: payload.ref_id,
      counterpartName: payload.icon_name || extractCounterpartName(payload.title),
      counterpartAvatar: payload.icon_avatar || null,
    },
  };
}

/**
 * Map a notification payload to the related detail screen. Returns null when
 * the notification has no associated screen in the current role's app.
 */
export function resolveNotificationTarget(
  role: UserRole | null,
  payload: PushPayload,
): RouterTarget | null {
  const { type, ref_id } = payload;
  if (!ref_id) return null;

  if (role === "parent") {
    switch (type) {
      case "report_published":
        return {
          screen: "ParentReportDetail",
          params: { reportId: ref_id },
        };
      case "iep_completed":
        return { screen: "IepPlanDetail", params: { planId: ref_id } };
      case "goal_achieved":
        return {
          screen: "IepObjectiveDetail",
          params: { objectiveId: ref_id },
        };
      case "new_chat_message":
        return chatRoomTarget(payload);
      default:
        return null;
    }
  }

  if (role === "teacher") {
    switch (type) {
      case "report_published":
        return { screen: "ReportDetail", params: { reportId: ref_id } };
      case "session_cancelled":
        return { screen: "SessionDetail", params: { sessionId: ref_id } };
      case "iep_completed":
        return { screen: "IepPlanDetail", params: { planId: ref_id } };
      case "goal_achieved":
        return {
          screen: "IepObjectiveDetail",
          params: { objectiveId: ref_id },
        };
      case "new_chat_message":
        return chatRoomTarget(payload);
      default:
        return null;
    }
  }
  return null;
}

/**
 * Tab name where NotificationList lives for the given role. Used by the
 * global push tap handler in App.tsx to switch to the right tab + screen.
 */
export function notificationHomeTabForRole(role: UserRole | null): string {
  return role === "parent" ? "ParentHomeTab" : "HomeTab";
}
