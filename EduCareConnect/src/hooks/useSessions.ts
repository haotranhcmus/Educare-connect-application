import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchStudentSessions,
  fetchTodaySessions,
  fetchMySessions,
  fetchSessionDetail,
  fetchSessionResults,
  fetchStudentActiveObjectives,
  fetchObjectivesByIds,
  createSession,
  updateSession,
} from "../api/sessionApi";
import { useAuthStore } from "../store/authStore";
import dayjs from "dayjs";

export function useStudentSessions(studentId: number) {
  return useQuery({
    queryKey: ["sessions", "student", studentId],
    queryFn: () => fetchStudentSessions(studentId),
    enabled: !!studentId,
  });
}

export function useTodaySessions() {
  const uid = useAuthStore((s) => s.uid);
  return useQuery({
    queryKey: ["sessions", "today", uid],
    queryFn: () => fetchTodaySessions(uid!),
    enabled: !!uid,
  });
}

export function useMySessions(filters?: {
  dateFrom?: string;
  dateTo?: string;
}) {
  const uid = useAuthStore((s) => s.uid);
  return useQuery({
    queryKey: ["sessions", "my", uid, filters],
    queryFn: () => fetchMySessions(uid!, filters),
    enabled: !!uid,
  });
}

/** Returns { week, month } completed session counts for the teacher. */
export function useWeekMonthStats() {
  const uid = useAuthStore((s) => s.uid);
  // dayjs().startOf("week") defaults to Sunday (US convention).
  // Vietnam uses Monday as first day of week — calculate manually.
  const today = dayjs();
  const dayOfWeek = today.day(); // 0=Sun, 1=Mon, ..., 6=Sat
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const weekFrom = today.subtract(daysFromMonday, "day").format("YYYY-MM-DD");
  const monthFrom = today.startOf("month").format("YYYY-MM-DD");
  const todayStr = today.format("YYYY-MM-DD");

  const weekQ = useQuery({
    queryKey: ["sessions", "my", uid, { dateFrom: weekFrom, dateTo: todayStr }],
    queryFn: () =>
      fetchMySessions(uid!, { dateFrom: weekFrom, dateTo: todayStr }),
    enabled: !!uid,
    select: (data) =>
      data.filter((s) => s.status === "done" || s.status === "completed")
        .length,
  });

  const monthQ = useQuery({
    queryKey: [
      "sessions",
      "my",
      uid,
      { dateFrom: monthFrom, dateTo: todayStr },
    ],
    queryFn: () =>
      fetchMySessions(uid!, { dateFrom: monthFrom, dateTo: todayStr }),
    enabled: !!uid,
    select: (data) =>
      data.filter((s) => s.status === "done" || s.status === "completed")
        .length,
  });

  return { week: weekQ.data ?? 0, month: monthQ.data ?? 0 };
}

export function useSessionDetail(sessionId: number) {
  return useQuery({
    queryKey: ["sessions", "detail", sessionId],
    queryFn: () => fetchSessionDetail(sessionId),
    enabled: sessionId > 0,
  });
}

export function useSessionResults(sessionId: number) {
  return useQuery({
    queryKey: ["sessions", "results", sessionId],
    queryFn: () => fetchSessionResults(sessionId),
    enabled: sessionId > 0,
  });
}

export function useStudentActiveObjectives(studentId: number) {
  return useQuery({
    queryKey: ["objectives", "active", studentId],
    queryFn: () => fetchStudentActiveObjectives(studentId),
    enabled: studentId > 0,
  });
}

/** Fetch objectives that belong to a specific session (by ID list). */
export function useSessionObjectives(objectiveIds: number[]) {
  return useQuery({
    queryKey: ["objectives", "byIds", objectiveIds],
    queryFn: () => fetchObjectivesByIds(objectiveIds),
    enabled: objectiveIds.length > 0,
  });
}

export function useCreateSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
  });
}

export function useUpdateSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      sessionId,
      vals,
    }: {
      sessionId: number;
      vals: Record<string, any>;
    }) => updateSession(sessionId, vals),
    onSuccess: (_, { sessionId }) => {
      queryClient.invalidateQueries({
        queryKey: ["sessions", "detail", sessionId],
      });
      queryClient.invalidateQueries({ queryKey: ["sessions", "my"] });
    },
  });
}
