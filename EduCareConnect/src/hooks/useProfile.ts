import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchMyProfile, changePassword, uploadAvatar } from "../api/profileApi";
import { useAuthStore } from "../store/authStore";

export function useMyProfile() {
  const uid = useAuthStore((s) => s.uid);
  return useQuery({
    queryKey: ["profile", "me", uid],
    queryFn: () => fetchMyProfile(uid!),
    enabled: !!uid,
  });
}

export function useUploadAvatar() {
  const qc = useQueryClient();
  const uid = useAuthStore((s) => s.uid);
  return useMutation({
    mutationFn: ({ base64Image }: { base64Image: string }) =>
      uploadAvatar(uid!, base64Image),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile", "me", uid] });
    },
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


