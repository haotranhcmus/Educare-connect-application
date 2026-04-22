import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchMyProfile, changePassword } from "../api/profileApi";
import { useAuthStore } from "../store/authStore";

export function useMyProfile() {
  const uid = useAuthStore((s) => s.uid);
  return useQuery({
    queryKey: ["profile", "me", uid],
    queryFn: () => fetchMyProfile(uid!),
    enabled: !!uid,
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: ({
      oldPassword,
      newPassword,
    }: {
      oldPassword: string;
      newPassword: string;
    }) => changePassword(oldPassword, newPassword),
  });
}
