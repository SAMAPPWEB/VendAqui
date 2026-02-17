-- ============================================
-- MIGRATION: Create booking_media table (Robust)
-- ============================================

-- Create table if not exists
CREATE TABLE IF NOT EXISTS booking_media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    folder_name VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    filename TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS (Ensure it is enabled)
ALTER TABLE booking_media ENABLE ROW LEVEL SECURITY;

-- Drop existings policies to avoid conflict
DROP POLICY IF EXISTS "Todos podem ver mídias" ON booking_media;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir mídias" ON booking_media;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar mídias" ON booking_media;

-- Create Policies
CREATE POLICY "Todos podem ver mídias" ON booking_media FOR SELECT USING (true);
CREATE POLICY "Usuários autenticados podem inserir mídias" ON booking_media FOR INSERT WITH CHECK (true);
CREATE POLICY "Usuários autenticados podem deletar mídias" ON booking_media FOR DELETE USING (true);

-- Create Index if not exists
CREATE INDEX IF NOT EXISTS idx_booking_media_booking_id ON booking_media(booking_id);
