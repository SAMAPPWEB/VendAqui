-- ============================================
-- STORAGE CONFIGURATION
-- ============================================

-- 1. Create the 'photos' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('photos', 'photos', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Enable RLS on objects (files)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Create Policies for 'photos' bucket

-- Allow Public Read (View)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'photos' );

-- Allow Authenticated Upload (Insert)
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'photos' );

-- Allow Authenticated Update/Delete
DROP POLICY IF EXISTS "Authenticated Update" ON storage.objects;
CREATE POLICY "Authenticated Update"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'photos' );

DROP POLICY IF EXISTS "Authenticated Delete" ON storage.objects;
CREATE POLICY "Authenticated Delete"
ON storage.objects FOR DELETE
USING ( bucket_id = 'photos' );
