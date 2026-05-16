# Supabase Storage setup — `deliverables` bucket

The admin deliverables feature can upload files (PDFs, designs, archives…) to
Supabase Storage. **You must create the bucket manually once** — Hulabe code
expects it to exist and uses the service-role key to read/write.

## 1. Create the bucket

1. Open https://supabase.com/dashboard → your project → **Storage**.
2. Click **New bucket**.
3. **Name:** `deliverables` (exactly — case-sensitive).
4. **Public:** **NO** (uncheck). We serve files via signed URLs only.
5. **File size limit:** 50 MB (matches the limit enforced by the server action;
   raise both if you need larger uploads).
6. **Allowed MIME types:** leave empty (any).
7. Click **Save**.

## 2. (Optional but recommended) Restrictive RLS policies

If you ever expose the anon key to authenticated end-users in a way that could
hit Storage directly, lock it down by enabling RLS on `storage.objects` and
restricting access to the service role only:

```sql
-- Run once in Supabase → SQL Editor
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- No public reads / writes on the deliverables bucket.
-- The Hulabe app reaches Storage via the SERVICE_ROLE key (server-side only),
-- which bypasses RLS by design.
DROP POLICY IF EXISTS "deliverables_no_anon"  ON storage.objects;
CREATE POLICY "deliverables_no_anon" ON storage.objects
  FOR ALL
  TO anon, authenticated
  USING (bucket_id <> 'deliverables')
  WITH CHECK (bucket_id <> 'deliverables');
```

## 3. Verify

In the admin UI, go to any project → Deliverables section → "Kind: File" →
pick a small file → Add. It should upload and appear in the list with the
download icon. Click the icon to open a signed URL (1-hour expiry by default).

The corresponding storage key looks like:
`<projectId>/<timestamp>-<safe-filename>`

## 4. Costs

Supabase free tier includes 1 GB of storage and 2 GB of egress per month. For
client deliverables (mostly design files + small docs) this is typically
plenty. Monitor usage in Supabase → Settings → Usage.
