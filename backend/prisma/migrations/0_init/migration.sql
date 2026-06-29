-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'PENDING', 'AWAITING_ANCHOR', 'AWAITING_PAYMENT', 'PROCESSING', 'PAID', 'SETTLING', 'SETTLED_FIAT', 'ANCHOR_ERROR', 'NEEDS_KYC', 'FAILED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PayoutMethod" AS ENUM ('CRYPTO', 'BRE_B');

-- CreateEnum
CREATE TYPE "AnchorProvider" AS ENUM ('TESTNET', 'MOCK_BREB', 'ABROAD');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('XLM', 'USDC', 'EURC');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('CONFIRMED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATED', 'UPDATED', 'SENT', 'PAID', 'OFFRAMP_INITIATED', 'OFFRAMP_AWAITING_PAYMENT', 'OFFRAMP_PROCESSING', 'OFFRAMP_SETTLED', 'OFFRAMP_ERROR', 'EXPIRED', 'CANCELLED', 'DELETED');

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "invoice_number" TEXT NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "freelancer_wallet" TEXT NOT NULL,
    "freelancer_name" TEXT,
    "freelancer_email" TEXT,
    "freelancer_company" TEXT,
    "client_name" TEXT NOT NULL,
    "client_email" TEXT NOT NULL,
    "client_company" TEXT,
    "client_address" TEXT,
    "client_wallet" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "notes" TEXT,
    "subtotal" DECIMAL(18,7) NOT NULL,
    "tax_rate" DECIMAL(5,2),
    "tax_amount" DECIMAL(18,7),
    "discount" DECIMAL(18,7),
    "total" DECIMAL(18,7) NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'XLM',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "due_date" TIMESTAMP(3),
    "paid_at" TIMESTAMP(3),
    "transaction_hash" TEXT,
    "ledger_number" INTEGER,
    "payer_wallet" TEXT,
    "network_passphrase" TEXT NOT NULL DEFAULT 'Test SDF Network ; September 2015',
    "payout_method" "PayoutMethod" NOT NULL DEFAULT 'CRYPTO',
    "payout_alias" TEXT,
    "anchor_provider" "AnchorProvider",
    "anchor_tx_id" TEXT,
    "quote_id" TEXT,
    "quote_buy_amount" TEXT,
    "receipt_tx_hash" TEXT,
    "anchor_deposit_address" TEXT,
    "anchor_memo" TEXT,
    "anchor_memo_type" TEXT,
    "anchor_interactive_url" TEXT,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL,
    "freelancer_wallet" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "company" TEXT,
    "address" TEXT,
    "is_favorite" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "line_items" (
    "id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "rate" DECIMAL(18,7) NOT NULL,
    "amount" DECIMAL(18,7) NOT NULL,

    CONSTRAINT "line_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "transaction_hash" TEXT NOT NULL,
    "ledger_number" INTEGER NOT NULL,
    "from_wallet" TEXT NOT NULL,
    "to_wallet" TEXT NOT NULL,
    "amount" DECIMAL(18,7) NOT NULL,
    "asset" TEXT NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'CONFIRMED',
    "confirmed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_audit_logs" (
    "id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "actor_wallet" TEXT NOT NULL,
    "changes" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoice_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "invoices_invoice_number_key" ON "invoices"("invoice_number");

-- CreateIndex
CREATE INDEX "invoices_freelancer_wallet_idx" ON "invoices"("freelancer_wallet");

-- CreateIndex
CREATE INDEX "invoices_status_idx" ON "invoices"("status");

-- CreateIndex
CREATE INDEX "invoices_invoice_number_idx" ON "invoices"("invoice_number");

-- CreateIndex
CREATE INDEX "invoices_freelancer_wallet_status_idx" ON "invoices"("freelancer_wallet", "status");

-- CreateIndex
CREATE INDEX "invoices_freelancer_wallet_deleted_at_idx" ON "invoices"("freelancer_wallet", "deleted_at");

-- CreateIndex
CREATE INDEX "invoices_due_date_idx" ON "invoices"("due_date");

-- CreateIndex
CREATE INDEX "clients_freelancer_wallet_idx" ON "clients"("freelancer_wallet");

-- CreateIndex
CREATE INDEX "clients_is_favorite_idx" ON "clients"("is_favorite");

-- CreateIndex
CREATE UNIQUE INDEX "clients_freelancer_wallet_email_key" ON "clients"("freelancer_wallet", "email");

-- CreateIndex
CREATE UNIQUE INDEX "payments_transaction_hash_key" ON "payments"("transaction_hash");

-- CreateIndex
CREATE INDEX "payments_invoice_id_idx" ON "payments"("invoice_id");

-- CreateIndex
CREATE INDEX "payments_transaction_hash_idx" ON "payments"("transaction_hash");

-- CreateIndex
CREATE INDEX "invoice_audit_logs_invoice_id_idx" ON "invoice_audit_logs"("invoice_id");

-- CreateIndex
CREATE INDEX "invoice_audit_logs_created_at_idx" ON "invoice_audit_logs"("created_at");

-- AddForeignKey
ALTER TABLE "line_items" ADD CONSTRAINT "line_items_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_audit_logs" ADD CONSTRAINT "invoice_audit_logs_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

