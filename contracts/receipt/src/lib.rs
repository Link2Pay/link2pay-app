//! Link2Pay payment-receipt / attestation contract.
//!
//! Stores an immutable, on-chain receipt for each settled invoice and emits an
//! event for indexing. Writes are admin-gated via OpenZeppelin `ownable`
//! (`#[only_owner]`). The contract records receipts ONLY — it never holds,
//! transfers, or escrows funds, preserving Link2Pay's non-custodial guarantee.
//!
//! PII is never stored: the memo is recorded as a 32-byte hash (`memo_hash`).

#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, Address, BytesN, Env, String, Symbol,
};
use stellar_access::ownable::{set_owner, Ownable};
use stellar_macros::only_owner;

/// TTL management (OZ does not auto-manage storage TTL — we do it explicitly).
const DAY_IN_LEDGERS: u32 = 17_280;
const BUMP_AMOUNT: u32 = 90 * DAY_IN_LEDGERS;
const LIFETIME_THRESHOLD: u32 = BUMP_AMOUNT - DAY_IN_LEDGERS;

const RECEIPT_EVENT: Symbol = symbol_short!("receipt");

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    /// Receipt for a given invoice id.
    Receipt(String),
}

/// On-chain receipt for a settled invoice.
#[contracttype]
#[derive(Clone)]
pub struct Receipt {
    pub invoice_id: String,
    pub payer: Address,
    pub payee: Address,
    pub amount: i128,
    pub asset: String,
    pub anchor_tx_id: String,
    pub timestamp: u64,
    pub memo_hash: BytesN<32>,
}

#[contract]
pub struct ReceiptContract;

#[contractimpl]
impl ReceiptContract {
    /// Set the admin owner at deploy time.
    pub fn __constructor(e: &Env, owner: Address) {
        set_owner(e, &owner);
        e.storage()
            .instance()
            .extend_ttl(LIFETIME_THRESHOLD, BUMP_AMOUNT);
    }

    /// Write the receipt for a settled invoice. Admin-only.
    /// Fails if a receipt for this invoice already exists (receipts are immutable).
    #[only_owner]
    pub fn write_receipt(
        e: &Env,
        invoice_id: String,
        payer: Address,
        payee: Address,
        amount: i128,
        asset: String,
        anchor_tx_id: String,
        memo_hash: BytesN<32>,
    ) -> Receipt {
        let key = DataKey::Receipt(invoice_id.clone());
        if e.storage().persistent().has(&key) {
            panic!("receipt already exists for this invoice");
        }

        let receipt = Receipt {
            invoice_id: invoice_id.clone(),
            payer,
            payee: payee.clone(),
            amount,
            asset,
            anchor_tx_id,
            timestamp: e.ledger().timestamp(),
            memo_hash,
        };

        e.storage().persistent().set(&key, &receipt);
        e.storage()
            .persistent()
            .extend_ttl(&key, LIFETIME_THRESHOLD, BUMP_AMOUNT);
        e.storage()
            .instance()
            .extend_ttl(LIFETIME_THRESHOLD, BUMP_AMOUNT);

        // Emit an event for off-chain indexing. Topics: ("receipt", payee).
        e.events().publish((RECEIPT_EVENT, payee), receipt.clone());

        receipt
    }

    /// Read a receipt by invoice id. Public.
    pub fn get_receipt(e: &Env, invoice_id: String) -> Option<Receipt> {
        let key = DataKey::Receipt(invoice_id);
        let receipt = e.storage().persistent().get::<_, Receipt>(&key);
        if receipt.is_some() {
            e.storage()
                .persistent()
                .extend_ttl(&key, LIFETIME_THRESHOLD, BUMP_AMOUNT);
        }
        receipt
    }

    /// Whether a receipt exists for the given invoice id. Public.
    pub fn has_receipt(e: &Env, invoice_id: String) -> bool {
        e.storage().persistent().has(&DataKey::Receipt(invoice_id))
    }
}

// Expose the standard Ownable interface (get_owner, transfer_ownership, etc.).
#[contractimpl(contracttrait)]
impl Ownable for ReceiptContract {}

#[cfg(test)]
mod test;
