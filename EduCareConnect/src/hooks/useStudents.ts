import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useAuthStore } from "@store/authStore";
import {
  fetchMyStudents,
  fetchStudentDetail,
  fetchStudentIdsWithActivePlan,
} from "@api/studentApi";
import { queryKeys } from "@api/queryKeys";
import type { StudentListItem, StudentDetail } from "@t";

export function useMyStudents() {
  const uid = useAuthStore((s) => s.uid);

  return useQuery<StudentListItem[]>({
    queryKey: queryKeys.students.mine(uid),
    queryFn: () => fetchMyStudents(uid!),
    enabled: !!uid,
  });
}

export function useStudentDetail(studentId: number) {
  return useQuery<StudentDetail>({
    queryKey: queryKeys.students.detail(studentId),
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
    queryKey: queryKeys.students.mine(uid),
    queryFn: () => fetchMyStudents(uid!),
    enabled: !!uid,
  });

  const planQuery = useQuery<number[]>({
    queryKey: queryKeys.students.withActivePlan(),
    queryFn: fetchStudentIdsWithActivePlan,
    enabled: !!uid,
  });

  const filtered = useMemo(() => {
    const all = studentsQuery.data ?? [];
    const planIds = planQuery.data;
    if (!planIds) return all;
    const planIdSet = new Set(planIds);
    return all.filter((s) => planIdSet.has(s.id));
  }, [studentsQuery.data, planQuery.data]);

  return {
    data: filtered,
    isLoading: studentsQuery.isLoading || planQuery.isLoading,
    refetch: studentsQuery.refetch,
  };
}

export function useMyStudentsSuspense() {
  const uid = useAuthStore((s) => s.uid);
  // Caller must guard mounting until uid is available — Suspense can't be
  // disabled like useQuery.
  return useSuspenseQuery<StudentListItem[]>({
    queryKey: queryKeys.students.mine(uid),
    queryFn: () => fetchMyStudents(uid!),
  });
}

export function useStudentDetailSuspense(studentId: number) {
  return useSuspenseQuery<StudentDetail>({
    queryKey: queryKeys.students.detail(studentId),
    queryFn: () => fetchStudentDetail(studentId),
  });
}
