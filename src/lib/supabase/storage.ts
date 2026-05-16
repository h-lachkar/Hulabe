import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Hulabe uses a single Supabase Storage bucket named "deliverables" for all
 * project files. Bucket should be created manually:
 *
 *   Supabase Dashboard → Storage → New bucket
 *     - Name: "deliverables"
 *     - Public: false (we serve via signed URLs)
 *     - File size limit: 50 MB (or per your plan)
 *
 * Objects are organized as:
 *   {projectId}/{timestamp}-{originalFilename}
 *
 * Signed URLs are minted on-demand for the client portal (7-day expiry).
 */

export const DELIVERABLES_BUCKET = "deliverables";

/** Build a deterministic, collision-safe storage key. */
export function buildDeliverableKey(projectId: string, filename: string) {
  // Strip any path components from the filename for safety.
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100);
  return `${projectId}/${Date.now()}-${safe}`;
}

/**
 * Upload a File / Blob to the deliverables bucket. Returns the storage key
 * (relative to the bucket — store this in Deliverable.fileKey).
 */
export async function uploadDeliverableFile(
  projectId: string,
  file: File,
): Promise<{ key: string; size: number; contentType: string }> {
  const supabase = createSupabaseAdminClient();
  const key = buildDeliverableKey(projectId, file.name);

  const { error } = await supabase.storage
    .from(DELIVERABLES_BUCKET)
    .upload(key, file, {
      contentType: file.type || "application/octet-stream",
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  return {
    key,
    size: file.size,
    contentType: file.type || "application/octet-stream",
  };
}

/** Generate a short-lived signed URL for a stored file (default 7 days). */
export async function getDeliverableSignedUrl(
  key: string,
  expiresInSeconds = 60 * 60 * 24 * 7,
): Promise<string | null> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.storage
    .from(DELIVERABLES_BUCKET)
    .createSignedUrl(key, expiresInSeconds);
  if (error || !data) return null;
  return data.signedUrl;
}

/** Permanently remove an object. Best-effort (does not throw). */
export async function deleteDeliverableFile(key: string): Promise<void> {
  const supabase = createSupabaseAdminClient();
  await supabase.storage.from(DELIVERABLES_BUCKET).remove([key]);
}

/** Human-readable file size. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
