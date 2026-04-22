import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchStudentReports,
  fetchPendingReportCount,
  fetchMyReports,
  fetchReportDetail,
  fetchSessionsAvailableForReport,
  createReport,
  updateReport,
  sendReport,
} from "../api/reportApi";
import { useAuthStore } from "../store/authStore";

export function useStudentReports(studentId: number) {
  return useQuery({
    queryKey: ["reports", "student", studentId],
    queryFn: () => fetchStudentReports(studentId),
    enabled: !!studentId,
  });
}

export function usePendingReportCount() {
  const uid = useAuthStore((s) => s.uid);
  return useQuery({
    queryKey: ["pendingReportCount", "teacher", uid],
    queryFn: () => fetchPendingReportCount(uid!),
    enabled: !!uid,
  });
}

export function useMyReports() {
  const uid = useAuthStore((s) => s.uid);
  return useQuery({
    queryKey: ["reports", "my", uid],
    queryFn: () => fetchMyReports(uid!),
    enabled: !!uid,
  });
}

export function useReportDetail(reportId: number) {
  return useQuery({
    queryKey: ["reports", "detail", reportId],
    queryFn: () => fetchReportDetail(reportId),
    enabled: reportId > 0,
  });
}

export function useSessionsForReport() {
  const uid = useAuthStore((s) => s.uid);
  return useQuery({
    queryKey: ["sessions", "available-for-report", uid],
    queryFn: () => fetchSessionsAvailableForReport(uid!),
    enabled: !!uid,
  });
}

export function useCreateReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createReport,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}

export function useUpdateReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      reportId,
      vals,
    }: {
      reportId: number;
      vals: Record<string, any>;
    }) => updateReport(reportId, vals),
    onSuccess: (_, { reportId }) => {
      qc.invalidateQueries({ queryKey: ["reports", "detail", reportId] });
      qc.invalidateQueries({ queryKey: ["reports", "my"] });
    },
  });
}

export function useSendReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: sendReport,
    onSuccess: (_, reportId) => {
      qc.invalidateQueries({ queryKey: ["reports", "detail", reportId] });
      qc.invalidateQueries({ queryKey: ["reports", "my"] });
    },
  });
}
