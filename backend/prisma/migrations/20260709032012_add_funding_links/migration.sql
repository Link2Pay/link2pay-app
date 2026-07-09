-- CreateEnum
CREATE TYPE "FundingLinkStatus" AS ENUM ('PENDING', 'ACTIVE', 'CLAIMED', 'RECLAIMED');

-- CreateTable
CREATE TABLE "funding_links" (
    "id" TEXT NOT NULL,
    "creator_wallet" TEXT NOT NULL,
    "escrow_account" TEXT NOT NULL,
    "asset" "Currency" NOT NULL DEFAULT 'USDC',
    "amount" DECIMAL(18,7) NOT NULL,
    "network_passphrase" TEXT NOT NULL DEFAULT 'Test SDF Network ; September 2015',
    "expires_at" TIMESTAMP(3),
    "status" "FundingLinkStatus" NOT NULL DEFAULT 'PENDING',
    "claimed_by" TEXT,
    "claim_tx_hash" TEXT,
    "creation_tx_hash" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "funding_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "funding_links_escrow_account_key" ON "funding_links"("escrow_account");

-- CreateIndex
CREATE INDEX "funding_links_creator_wallet_idx" ON "funding_links"("creator_wallet");
