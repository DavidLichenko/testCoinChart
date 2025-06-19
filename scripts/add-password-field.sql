-- Add password field to User table for authentication
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "password" TEXT;

-- Create index for faster email lookups
CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"("email");
