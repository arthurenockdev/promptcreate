-- Enable the pgcrypto extension for UUID generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create the projects table
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  files JSONB NOT NULL
);

-- Create the projects bucket if it doesn't exist
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES (
    'projects',
    'projects',
    false,
    52428800,  -- 50MB
    ARRAY['text/plain', 'application/json']::text[]
  )
  ON CONFLICT (id) DO NOTHING;
END $$;

-- Grant access to the service role
GRANT ALL ON storage.buckets TO service_role;
GRANT ALL ON storage.objects TO service_role;

-- Enable RLS for storage.buckets
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

-- Drop existing bucket policies if they exist
DROP POLICY IF EXISTS "Enable bucket creation for all users" ON storage.buckets;
DROP POLICY IF EXISTS "Enable bucket access for all users" ON storage.buckets;

-- Create bucket policies
CREATE POLICY "Enable bucket creation for all users" ON storage.buckets FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Enable bucket access for all users" ON storage.buckets FOR SELECT
    USING (true);

-- Enable RLS for storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing object policies if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON storage.objects;
DROP POLICY IF EXISTS "Enable insert access for all users" ON storage.objects;
DROP POLICY IF EXISTS "Enable update access for all users" ON storage.objects;
DROP POLICY IF EXISTS "Enable delete access for all users" ON storage.objects;

-- Create storage object policies
CREATE POLICY "Enable read access for all users" ON storage.objects FOR SELECT
    USING (bucket_id = 'projects');

CREATE POLICY "Enable insert access for all users" ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'projects');

CREATE POLICY "Enable update access for all users" ON storage.objects FOR UPDATE
    USING (bucket_id = 'projects')
    WITH CHECK (bucket_id = 'projects');

CREATE POLICY "Enable delete access for all users" ON storage.objects FOR DELETE
    USING (bucket_id = 'projects');
