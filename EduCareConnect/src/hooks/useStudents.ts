import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useAuthStore } from "../store/authStore";
import {
  fetchMyStudents,
  fetchStudentDetail,
  fetchStudentIdsWithActivePlan,
} from "../api/studentApi";
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

/**
 * Returns only the teacher's students that have at least one active IEP plan.
 * Used in session creation to ensure objectives are available.
 */
export function useStudentsWithActivePlan() {
  const uid = useAuthStore((s) => s.uid);

  const studentsQuery = useQuery<StudentListItem[]>({
    queryKey: ["students", "mine", uid],
    queryFn: () => fetchMyStudents(uid!),
    enabled: !!uid,
  });

  const planQuery = useQuery<Set<number>>({
    queryKey: ["students", "with-active-plan"],
    queryFn: fetchStudentIdsWithActivePlan,
    enabled: !!uid,
  });

  const filtered = useMemo(() => {
    const all = studentsQuery.data ?? [];
    const planIds = planQuery.data;
    if (!planIds) return all;
    return all.filter((s) => planIds.has(s.id));
  }, [studentsQuery.data, planQuery.data]);

  return {
    data: filtered,
    isLoading: studentsQuery.isLoading || planQuery.isLoading,
    refetch: studentsQuery.refetch,
  };
}
