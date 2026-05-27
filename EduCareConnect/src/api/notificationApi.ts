import { callJsonRoute } from "@api/odooClient";

export type NotificationType =
  | "report_published"
  | "session_cancelled"
  | "iep_completed"
  | "goal_achieved"
  | "new_chat_message";

export interface NotificationItem {
  id: number;
  type: NotificationType;
  title: string;
  body: string;
  ref_model: string | null;
  ref_id: number | null;
  is_read: boolean;
  created_at: string;
  /**
   * For chat notis: base64 data URI of the sender's avatar, or null when
   * the user has no custom photo. Other types leave this null.
   */
  icon_avatar?: string | null;
  /** Display name used to build initials when icon_avatar is null. */
  icon_name?: string | null;
}

export async function registerPushToken(input: {
  expoToken: string;
  platform: "ios" | "android";
  deviceName?: string;
  appVersion?: string;
}): Promise<{ ok: boolean; token_id?: number; error?: string }> {
  return callJsonRoute("/api/notifications/register-token", {
    expo_token: input.expoToken,
    platform: input.platform,
    device_name: input.deviceName,
    app_version: input.appVersion,
  });
}

export async function fetchNotifications(input?: {
  limit?: number;
  offset?: number;
  onlyUnread?: boolean;
}): Promise<NotificationItem[]> {
  const result = await callJsonRoute<{ items: NotificationItem[] }>(
    "/api/notifications/list",
    {
      limit: input?.limit ?? 50,
      offset: input?.offset ?? 0,
      only_unread: input?.onlyUnread ?? false,
    },
  );
  return result.items;
}

export async function fetchUnreadCount(): Promise<number> {
  const result = await callJsonRoute<{ count: number }>(
    "/api/notifications/unread-count",
  );
  return result.count;
}

export async function markNotificationsRead(input: {
  ids?: number[];
  all?: boolean;
}): Promise<{ ok: boolean; marked?: number }> {
  return callJsonRoute("/api/notifications/mark-read", {
    ids: input.ids,
    all: input.all,
  });
}
