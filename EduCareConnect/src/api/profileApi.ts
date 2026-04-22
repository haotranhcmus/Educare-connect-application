import { callKw, searchRead } from "./odooClient";

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
  avatar: string | false; // base64
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
    ],
    { limit: 1 },
  );
  if (!records.length) {
    throw new Error("User profile not found");
  }
  return records[0];
}

export async function changePassword(
  oldPassword: string,
  newPassword: string,
): Promise<void> {
  await callKw("res.users", "change_password", [oldPassword, newPassword], {});
}
