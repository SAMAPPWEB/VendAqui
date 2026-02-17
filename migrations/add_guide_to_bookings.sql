-- Migration: Add Guide information to Bookings
-- Author: Antigravity
-- Date: 2026-02-17

ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS guide_id UUID REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS guide_name VARCHAR(255);

-- Update existing bookings (Optional)
-- In case you want to assign a default guide for existing bookings
-- UPDATE bookings SET guide_name = 'Guia Geral' WHERE guide_name IS NULL;
