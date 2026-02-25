ALTER TABLE "invoices"
ADD COLUMN IF NOT EXISTS "network_passphrase" TEXT NOT NULL DEFAULT 'Test SDF Network ; September 2015';
