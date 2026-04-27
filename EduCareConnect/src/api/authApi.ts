import { searchRead } from "./odooClient";

export interface UserProfile {
  id: number;
  role: string;
  center_id: [number, string] | false;
  display_name: string;
}

/**
 * Fetch Educare user profile for a given uid.
 * Called right after authenticate() to get role + center info.
 *
 * NOTE: session_id must be active (via setActiveSession) before calling this,
 * because educare.user.profile is protected by record rules.
 */
export async function fetchUserProfile(uid: number): Promise<UserProfile> {
  const records = await searchRead<UserProfile>(
    "educare.user.profile",
    [["user_id", "=", uid]],
    ["id", "role", "center_id", "display_name"],
    { limit: 1 },
  );

  if (!records || records.length === 0) {
    throw new Error("Không tìm thấy hồ sơ người dùng");
  }

  return records[0];
}
