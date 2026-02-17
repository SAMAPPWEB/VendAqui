-- Add daily_rate to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS daily_rate DECIMAL(10, 2) DEFAULT 0;

-- Add guide_revenue to bookings table
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS guide_revenue DECIMAL(10, 2) DEFAULT 0;
