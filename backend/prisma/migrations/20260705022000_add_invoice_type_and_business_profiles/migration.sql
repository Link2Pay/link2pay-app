-- CreateEnum
CREATE TYPE "InvoiceType" AS ENUM ('DIRECT_PAYMENT', 'BUSINESS_INVOICE', 'SERVICE_INVOICE');

-- CreateEnum
CREATE TYPE "KycStatus" AS ENUM ('UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED');

-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "client_tax_id" TEXT,
ADD COLUMN     "freelancer_address" TEXT,
ADD COLUMN     "freelancer_logo_url" TEXT,
ADD COLUMN     "freelancer_phone" TEXT,
ADD COLUMN     "freelancer_tax_id" TEXT,
ADD COLUMN     "invoice_type" "InvoiceType" NOT NULL DEFAULT 'DIRECT_PAYMENT',
ADD COLUMN     "is_open_amount" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "business_profiles" (
    "id" TEXT NOT NULL,
    "wallet_address" TEXT NOT NULL,
    "display_name" TEXT,
    "legal_name" TEXT,
    "tax_id" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address_line" TEXT,
    "city" TEXT,
    "country" TEXT,
    "logo_url" TEXT,
    "default_currency" "Currency" NOT NULL DEFAULT 'USDC',
    "default_payout_method" "PayoutMethod" NOT NULL DEFAULT 'CRYPTO',
    "default_payout_alias" TEXT,
    "kyc_status" "KycStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "kyc_provider" TEXT,
    "kyc_ref" TEXT,
    "kyc_verified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "business_profiles_wallet_address_key" ON "business_profiles"("wallet_address");

