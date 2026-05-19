import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchStudentReports,
  fetchPendingReportCount,
  fetchMyReports,
  fetchReportDetail,
  fetchSessionsAvailableForReport,
  fetchReportForSession,
  createReport,
  updateReport,
  sendReport,
  fetchReportPhotoUrls,
} from "../api/reportApi";
import {
  persistReport,
  persistAndSendReport,
} from "../services/reportService";
import type { PhotoAsset } from "../types";
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

export function useReportForSession(sessionId: number) {
  return useQuery({
    queryKey: ["reports", "for-session", sessionId],
    queryFn: () => fetchReportForSession(sessionId),
    enabled: sessionId > 0,
  });
}

export function useCreateReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createReport,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reports"] });
      qc.invalidateQueries({ queryKey: ["sessions", "available-for-report"] });
      qc.invalidateQueries({ queryKey: ["pendingReportCount"] });
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
      qc.invalidateQueries({ queryKey: ["reports"] });
      qc.invalidateQueries({ queryKey: ["sessions", "available-for-report"] });
      qc.invalidateQueries({ queryKey: ["pendingReportCount"] });
    },
  });
}

export function useReportPhotos(attachmentIds: number[] | undefined) {
  return useQuery({
    queryKey: ["report-photos", attachmentIds],
    queryFn: () => fetchReportPhotoUrls(attachmentIds!),
    enabled: !!attachmentIds && attachmentIds.length > 0,
  });
}

interface PersistReportArgs {
  reportId?: number | null;
  payload: Record<string, unknown>;
  photoAssets: PhotoAsset[];
}

/**
 * Persist a draft report (create-or-update + upload photos) and invalidate
 * affected caches. Use this in place of chaining `useCreateReport` /
 * `useUpdateReport` + a manual `uploadReportPhotos` call.
 */
export function usePersistReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: PersistReportArgs) => persistReport(args),
    onSuccess: (reportId) => {
      qc.invalidateQueries({ queryKey: ["reports"] });
      qc.invalidateQueries({ queryKey: ["reports", "detail", reportId] });
      qc.invalidateQueries({ queryKey: ["sessions", "available-for-report"] });
      qc.invalidateQueries({ queryKey: ["pendingReportCount"] });
    },
  });
}

/**
 * Persist then transition the report to "sent". One-shot save+send flow.
 */
export function usePersistAndSendReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: PersistReportArgs) => persistAndSendReport(args),
    onSuccess: (reportId) => {
      qc.invalidateQueries({ queryKey: ["reports"] });
      qc.invalidateQueries({ queryKey: ["reports", "detail", reportId] });
      qc.invalidateQueries({ queryKey: ["sessions", "available-for-report"] });
      qc.invalidateQueries({ queryKey: ["pendingReportCount"] });
    },
  });
}
