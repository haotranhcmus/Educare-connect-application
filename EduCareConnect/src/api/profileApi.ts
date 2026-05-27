import { callKw, searchRead, write } from "@api/odooClient";

export interface UserProfile {
  id: number;
  display_name: string;
  role: string;
  email: string | false;
  phone: string | false;
  center_id: [number, string] | false;
  certification: string | false;
  years_experience: number;
  max_students: number;
  current_student_count: number;
  avatar: string | false; // base64 — always set because Odoo auto-generates a default letter avatar
  has_custom_avatar: boolean; // true only when the user actually uploaded their own image
}

export async function fetchMyProfile(userId: number): Promise<UserProfile> {
  const records = await searchRead<UserProfile>(
    "educare.user.profile",
    [["user_id", "=", userId]],
    [
      "id",
      "display_name",
      "role",
      "email",
      "phone",
      "center_id",
      "certification",
      "years_experience",
      "max_students",
      "current_student_count",
      "avatar",
      "has_custom_avatar",
    ],
    { limit: 1 },
  );
  if (!records.length) {
    throw new Error("User profile not found");
  }
  return records[0];
}

export async function uploadAvatar(
  userId: number,
  base64Image: string,
): Promise<void> {
  // The 'avatar' field on educare.user.profile is a read-only related field
  // pointing to user_id.image_128. We must write image_1920 on res.users directly.
  const data = base64Image.includes(",")
    ? base64Image.split(",")[1]
    : base64Image;
  await write("res.users", [userId], { image_1920: data });
}

export async function changePassword(
  oldPassword: string,
  newPassword: string,
): Promise<void> {
  await callKw("res.users", "change_password", [oldPassword, newPassword], {});
}
