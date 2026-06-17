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
} from "@api/reportApi";
import { persistReport, persistAndSendReport } from "@services/reportService";
import { queryKeys } from "@api/queryKeys";
import type { PhotoAsset } from "@t";
import { useAuthStore } from "@store/authStore";
import { useSuspenseQuery } from "@tanstack/react-query";

export function useMyReportsSuspense() {
  const uid = useAuthStore((s) => s.uid);
  return useSuspenseQuery({
    queryKey: queryKeys.reports.my(uid),
    queryFn: () => fetchMyReports(uid!),
  });
}

export function useReportDetailSuspense(reportId: number) {
  return useSuspenseQuery({
    queryKey: queryKeys.reports.detail(reportId),
    queryFn: () => fetchReportDetail(reportId),
  });
}

export function useStudentReports(studentId: number) {
  return useQuery({
    queryKey: queryKeys.reports.student(studentId),
    queryFn: () => fetchStudentReports(studentId),
    enabled: !!studentId,
  });
}

export function usePendingReportCount() {
  const uid = useAuthStore((s) => s.uid);
  return useQuery({
    queryKey: queryKeys.reports.pendingCount(uid),
    queryFn: () => fetchPendingReportCount(uid!),
    enabled: !!uid,
  });
}

export function useMyReports() {
  const uid = useAuthStore((s) => s.uid);
  return useQuery({
    queryKey: queryKeys.reports.my(uid),
    queryFn: () => fetchMyReports(uid!),
    enabled: !!uid,
  });
}

export function useReportDetail(reportId: number) {
  return useQuery({
    queryKey: queryKeys.reports.detail(reportId),
    queryFn: () => fetchReportDetail(reportId),
    enabled: reportId > 0,
  });
}

export function useSessionsForReport() {
  const uid = useAuthStore((s) => s.uid);
  return useQuery({
    queryKey: queryKeys.sessions.availableForReport(uid),
    queryFn: () => fetchSessionsAvailableForReport(uid!),
    enabled: !!uid,
  });
}

export function useReportForSession(sessionId: number) {
  return useQuery({
    queryKey: queryKeys.reports.forSession(sessionId),
    queryFn: () => fetchReportForSession(sessionId),
    enabled: sessionId > 0,
  });
}

/**
 * Invalidate every cache touched by a create/update/send mutation. Centralised
 * so all mutation hooks invalidate identically.
 */
function invalidateAfterReportMutation(
  qc: ReturnType<typeof useQueryClient>,
  reportId?: number,
) {
  qc.invalidateQueries({ queryKey: queryKeys.reports.all });
  if (reportId !== undefined) {
    qc.invalidateQueries({ queryKey: queryKeys.reports.detail(reportId) });
  }
  // Use the broad prefix (no trailing uid): `availableForReport(undefined)`
  // produces `[..., undefined]`, which is NOT a prefix of `[..., <uid>]`, so it
  // would never match — leaving the "sessions without a report" list stale.
  qc.invalidateQueries({
    queryKey: queryKeys.sessions.availableForReportAll(),
  });
  // The "no report" filter overlays on the my-sessions lists too.
  qc.invalidateQueries({ queryKey: queryKeys.sessions.myAll() });
  // Broad invalidation of pending-count across users — uid prefix matches.
  qc.invalidateQueries({ queryKey: queryKeys.reports.pendingCountAll() });
}

export function useCreateReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createReport,
    onSuccess: () => invalidateAfterReportMutation(qc),
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
      qc.invalidateQueries({ queryKey: queryKeys.reports.detail(reportId) });
      qc.invalidateQueries({ queryKey: queryKeys.reports.my(undefined) });
    },
  });
}

export function useSendReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: sendReport,
    onSuccess: (_, reportId) => invalidateAfterReportMutation(qc, reportId),
  });
}

export function useReportPhotos(attachmentIds: number[] | undefined) {
  return useQuery({
    queryKey: queryKeys.reports.photos(attachmentIds),
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
    onSuccess: (reportId) => invalidateAfterReportMutation(qc, reportId),
  });
}

/**
 * Persist then transition the report to "sent". One-shot save+send flow.
 */
export function usePersistAndSendReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: PersistReportArgs) => persistAndSendReport(args),
    onSuccess: (reportId) => invalidateAfterReportMutation(qc, reportId),
  });
}
