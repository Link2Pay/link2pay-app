#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, BytesN, Env};

#[test]
fn test_initialize() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let operator = Address::generate(&env);
    let token = Address::generate(&env);

    let contract_id = env.register_contract(None, PrivacyPoolX402);
    let client = PrivacyPoolX402Client::new(&env, &contract_id);

    let result = client.initialize(&admin, &operator, &token);
    assert!(result.is_ok());

    // Verify initialized
    let deposit_count = client.get_deposit_count();
    assert_eq!(deposit_count, 0);
}

#[test]
#[should_panic(expected = "AlreadyInitialized")]
fn test_double_initialize() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let operator = Address::generate(&env);
    let token = Address::generate(&env);

    let contract_id = env.register_contract(None, PrivacyPoolX402);
    let client = PrivacyPoolX402Client::new(&env, &contract_id);

    client.initialize(&admin, &operator, &token);
    client.initialize(&admin, &operator, &token); // Should panic
}

#[test]
fn test_deposit() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let operator = Address::generate(&env);
    let token = Address::generate(&env);
    let user = Address::generate(&env);

    let contract_id = env.register_contract(None, PrivacyPoolX402);
    let client = PrivacyPoolX402Client::new(&env, &contract_id);

    client.initialize(&admin, &operator, &token);

    // Create a commitment
    let commitment = BytesN::from_array(&env, &[1u8; 32]);
    let amount = 1_000_0000000i128; // 1,000 XLM

    // Note: In real test, we'd need to mock token contract
    // For now, we're testing the logic without token transfer

    let leaf_index = client.deposit(&user, &amount, &commitment);
    assert_eq!(leaf_index, 0);

    let deposit_count = client.get_deposit_count();
    assert_eq!(deposit_count, 1);
}

#[test]
fn test_multiple_deposits() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let operator = Address::generate(&env);
    let token = Address::generate(&env);
    let user = Address::generate(&env);

    let contract_id = env.register_contract(None, PrivacyPoolX402);
    let client = PrivacyPoolX402Client::new(&env, &contract_id);

    client.initialize(&admin, &operator, &token);

    // Multiple deposits
    for i in 0..5 {
        let mut commitment_bytes = [0u8; 32];
        commitment_bytes[0] = i as u8;
        let commitment = BytesN::from_array(&env, &commitment_bytes);
        let amount = 100_0000000i128;

        let leaf_index = client.deposit(&user, &amount, &commitment);
        assert_eq!(leaf_index, i as u32);
    }

    let deposit_count = client.get_deposit_count();
    assert_eq!(deposit_count, 5);
}

#[test]
fn test_get_merkle_proof() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let operator = Address::generate(&env);
    let token = Address::generate(&env);
    let user = Address::generate(&env);

    let contract_id = env.register_contract(None, PrivacyPoolX402);
    let client = PrivacyPoolX402Client::new(&env, &contract_id);

    client.initialize(&admin, &operator, &token);

    // Deposit
    let commitment = BytesN::from_array(&env, &[1u8; 32]);
    let amount = 100_0000000i128;
    let leaf_index = client.deposit(&user, &amount, &commitment);

    // Get proof
    let proof = client.get_merkle_proof(&leaf_index);
    assert_eq!(proof.leaf, commitment);
    assert_eq!(proof.path_elements.len(), 10); // TREE_DEPTH
}

#[test]
fn test_get_root() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let operator = Address::generate(&env);
    let token = Address::generate(&env);

    let contract_id = env.register_contract(None, PrivacyPoolX402);
    let client = PrivacyPoolX402Client::new(&env, &contract_id);

    client.initialize(&admin, &operator, &token);

    let root = client.get_root();
    assert!(root.to_array().len() == 32);
}

#[test]
fn test_privacy_metrics() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let operator = Address::generate(&env);
    let token = Address::generate(&env);

    let contract_id = env.register_contract(None, PrivacyPoolX402);
    let client = PrivacyPoolX402Client::new(&env, &contract_id);

    client.initialize(&admin, &operator, &token);

    let metrics = client.get_privacy_metrics();
    assert_eq!(metrics.anonymity_set_size, 0);
    assert_eq!(metrics.total_deposited, 0);
    assert_eq!(metrics.total_withdrawn, 0);
}
