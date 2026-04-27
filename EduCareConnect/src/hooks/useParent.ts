import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchMyStudent,
  fetchMyStudents,
  fetchStudentById,
  fetchUnreadReportCount,
  fetchActiveIepPlan,
  fetchLatestSession,
  fetchSessionsThisWeek,
  fetchIepPlanHistory,
  fetchGoalsWithObjectives,
  fetchParentReports,
  markReportRead,
  fetchStudentTimetable,
} from "../api/parentApi";
import { useAuthStore } from "../store/authStore";

export function useMyStudent() {
  const uid = useAuthStore((s) => s.uid);
  return useQuery({
    queryKey: ["parent", "student", uid],
    queryFn: () => fetchMyStudent(uid!),
    enabled: !!uid,
  });
}

export function useMyStudents() {
  const uid = useAuthStore((s) => s.uid);
  return useQuery({
    queryKey: ["parent", "students", uid],
    queryFn: () => fetchMyStudents(uid!),
    enabled: !!uid,
  });
}

export function useStudentById(studentId?: number) {
  return useQuery({
    queryKey: ["parent", "studentById", studentId],
    queryFn: () => fetchStudentById(studentId!),
    enabled: !!studentId,
  });
}

export function useUnreadReportCount(studentId?: number) {
  return useQuery({
    queryKey: ["parent", "unreadCount", studentId],
    queryFn: () => fetchUnreadReportCount(studentId!),
    enabled: !!studentId,
  });
}

export function useActiveIepPlan(studentId?: number) {
  return useQuery({
    queryKey: ["parent", "activePlan", studentId],
    queryFn: () => fetchActiveIepPlan(studentId!),
    enabled: !!studentId,
  });
}

export function useLatestSession(studentId?: number) {
  return useQuery({
    queryKey: ["parent", "latestSession", studentId],
    queryFn: () => fetchLatestSession(studentId!),
    enabled: !!studentId,
  });
}

export function useSessionsThisWeek(studentId?: number) {
  return useQuery({
    queryKey: ["parent", "sessionsThisWeek", studentId],
    queryFn: () => fetchSessionsThisWeek(studentId!),
    enabled: !!studentId,
  });
}

export function useIepPlanHistory(studentId?: number) {
  return useQuery({
    queryKey: ["parent", "planHistory", studentId],
    queryFn: () => fetchIepPlanHistory(studentId!),
    enabled: !!studentId,
  });
}

export function useGoalsWithObjectives(planId?: number) {
  return useQuery({
    queryKey: ["parent", "goalsObjectives", planId],
    queryFn: () => fetchGoalsWithObjectives(planId!),
    enabled: !!planId,
  });
}

export function useParentReports(studentId?: number) {
  return useQuery({
    queryKey: ["parent", "reports", studentId],
    queryFn: () => fetchParentReports(studentId!),
    enabled: !!studentId,
  });
}

export function useMarkReportRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (reportId: number) => markReportRead(reportId),
    onSuccess: (_data, reportId) => {
      // Refresh the detail page cache
      qc.invalidateQueries({ queryKey: ["reports", "detail", reportId] });
      // Refresh parent report list
      qc.invalidateQueries({ queryKey: ["parent", "reports"] });
      // Refresh unread badge count
      qc.invalidateQueries({ queryKey: ["parent", "unreadCount"] });
    },
  });
}

export function useStudentTimetable(
  studentId?: number,
  dateFrom?: string,
  dateTo?: string,
) {
  return useQuery({
    queryKey: ["parent", "timetable", studentId, dateFrom, dateTo],
    queryFn: () => fetchStudentTimetable(studentId!, dateFrom, dateTo),
    enabled: !!studentId,
  });
}
