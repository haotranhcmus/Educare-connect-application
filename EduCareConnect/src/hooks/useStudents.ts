import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../store/authStore";
import { fetchMyStudents, fetchStudentDetail } from "../api/studentApi";
import type { StudentListItem, StudentDetail } from "../types";

export function useMyStudents() {
  const uid = useAuthStore((s) => s.uid);

  return useQuery<StudentListItem[]>({
    queryKey: ["students", "mine", uid],
    queryFn: () => fetchMyStudents(uid!),
    enabled: !!uid,
  });
}

export function useStudentDetail(studentId: number) {
  return useQuery<StudentDetail>({
    queryKey: ["students", "detail", studentId],
    queryFn: () => fetchStudentDetail(studentId),
    enabled: !!studentId,
  });
}