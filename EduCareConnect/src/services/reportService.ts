import {
  createReport,
  updateReport,
  sendReport,
  uploadReportPhotos,
} from "../api/reportApi";
import type { PhotoAsset } from "../types";

interface PersistArgs {
  /** When provided, performs an update; otherwise creates a new record. */
  reportId?: number | null;
  /** Field values to write. */
  payload: Record<string, unknown>;
  /** New photos to attach after upsert. */
  photoAssets: PhotoAsset[];
}

/**
 * Create/update a daily report and (optionally) upload new photo attachments.
 *
 * Centralizes the "create-or-update → upload" half of the save flow that
 * `ReportCreateScreen` performs in two places.
 */
export async function persistReport({
  reportId,
  payload,
  photoAssets,
}: PersistArgs): Promise<number> {
  let id: number;
  if (reportId) {
    await updateReport(reportId, payload);
    id = reportId;
  } else {
    id = await createReport(payload);
  }
  if (photoAssets.length > 0) {
    await uploadReportPhotos(id, photoAssets);
  }
  return id;
}

/**
 * Persist then transition to "sent". Throws if any step fails so callers can
 * surface a single error path.
 */
export async function persistAndSendReport(
  args: PersistArgs,
): Promise<number> {
  const id = await persistReport(args);
  await sendReport(id);
  return id;
}
