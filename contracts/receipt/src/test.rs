#![cfg(test)]

use soroban_sdk::{testutils::Address as _, Address, BytesN, Env, String};

use crate::{ReceiptContract, ReceiptContractClient};

fn setup(e: &Env) -> (Address, ReceiptContractClient) {
    let owner = Address::generate(e);
    let id = e.register(ReceiptContract, (owner.clone(),));
    (owner, ReceiptContractClient::new(e, &id))
}

#[test]
fn writes_and_reads_a_receipt() {
    let e = Env::default();
    e.mock_all_auths();
    let (_owner, client) = setup(&e);

    let invoice = String::from_str(&e, "inv_123");
    let payer = Address::generate(&e);
    let payee = Address::generate(&e);
    let asset = String::from_str(&e, "USDC");
    let anchor_tx = String::from_str(&e, "anchor_tx_abc");
    let memo_hash = BytesN::from_array(&e, &[7u8; 32]);

    client.write_receipt(
        &invoice, &payer, &payee, &1000_0000000i128, &asset, &anchor_tx, &memo_hash,
    );

    assert!(client.has_receipt(&invoice));
    let stored = client.get_receipt(&invoice).unwrap();
    assert_eq!(stored.payer, payer);
    assert_eq!(stored.payee, payee);
    assert_eq!(stored.amount, 1000_0000000i128);
}

#[test]
#[should_panic(expected = "receipt already exists")]
fn rejects_duplicate_receipt() {
    let e = Env::default();
    e.mock_all_auths();
    let (_owner, client) = setup(&e);

    let invoice = String::from_str(&e, "inv_dup");
    let a = Address::generate(&e);
    let asset = String::from_str(&e, "USDC");
    let anchor_tx = String::from_str(&e, "tx");
    let memo_hash = BytesN::from_array(&e, &[1u8; 32]);

    client.write_receipt(&invoice, &a, &a, &1i128, &asset, &anchor_tx, &memo_hash);
    client.write_receipt(&invoice, &a, &a, &1i128, &asset, &anchor_tx, &memo_hash);
}

#[test]
fn get_missing_receipt_returns_none() {
    let e = Env::default();
    let (_owner, client) = setup(&e);
    assert!(client.get_receipt(&String::from_str(&e, "nope")).is_none());
}
