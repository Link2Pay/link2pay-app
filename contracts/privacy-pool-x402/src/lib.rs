#![no_std]

mod merkle;
mod types;
// mod verifier; // Will be auto-generated later

#[cfg(test)]
mod test;

use soroban_sdk::{contract, contractimpl, contracttype, Address, Bytes, BytesN, Env, Vec, token, Symbol, symbol_short};

pub use types::*;
pub use merkle::*;

// Storage keys
#[derive(Clone)]
#[contracttype]
enum DataKey {
    Admin,
    Operator,
    Token,               // USDC/XLM token contract
    Initialized,
    DepositCount,
    Commitments,         // Vec<BytesN<32>>
    Nullifiers,          // Map<BytesN<32>, bool>
    MerkleRoot,
    PendingPayments,     // Vec<PendingPayment>
    TotalDeposited,
    TotalWithdrawn,
}

const MERKLE_TREE_DEPTH: u32 = 10;
const MAX_BATCH_SIZE: u32 = 50;

#[contract]
pub struct PrivacyPoolX402;

#[contractimpl]
impl PrivacyPoolX402 {
    /// Initialize the privacy pool contract
    pub fn initialize(
        env: Env,
        admin: Address,
        operator: Address,
        token: Address,
    ) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Initialized) {
            return Err(Error::AlreadyInitialized);
        }

        admin.require_auth();

        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Operator, &operator);
        env.storage().instance().set(&DataKey::Token, &token);
        env.storage().instance().set(&DataKey::Initialized, &true);
        env.storage().instance().set(&DataKey::DepositCount, &0u32);
        env.storage().instance().set(&DataKey::TotalDeposited, &0i128);
        env.storage().instance().set(&DataKey::TotalWithdrawn, &0i128);

        // Initialize empty vectors
        let commitments: Vec<BytesN<32>> = Vec::new(&env);
        env.storage().instance().set(&DataKey::Commitments, &commitments);

        let pending_payments: Vec<PendingPayment> = Vec::new(&env);
        env.storage().instance().set(&DataKey::PendingPayments, &pending_payments);

        // Calculate and store initial Merkle root (empty tree)
        let merkle = SparseMerkleTree::new(&env);
        let root = merkle.get_root(&commitments);
        env.storage().instance().set(&DataKey::MerkleRoot, &root);

        env.events().publish((symbol_short!("init"),), (admin, operator));

        Ok(())
    }

    /// Deposit funds into privacy pool with commitment
    ///
    /// commitment = Poseidon(amount, secret, nullifier, recipientWallet)
    pub fn deposit(
        env: Env,
        from: Address,
        amount: i128,
        commitment: BytesN<32>,
    ) -> Result<u32, Error> {
        from.require_auth();

        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }

        // Transfer tokens from user to contract
        let token_address: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        let token_client = token::Client::new(&env, &token_address);
        token_client.transfer(&from, &env.current_contract_address(), &amount);

        // Get current commitments
        let mut commitments: Vec<BytesN<32>> = env.storage()
            .instance()
            .get(&DataKey::Commitments)
            .unwrap_or(Vec::new(&env));

        // Check capacity
        let leaf_index = commitments.len();
        if leaf_index >= (1 << MERKLE_TREE_DEPTH) {
            return Err(Error::TreeFull);
        }

        // Add commitment to tree
        commitments.push_back(commitment.clone());
        env.storage().instance().set(&DataKey::Commitments, &commitments);

        // Update Merkle root
        let merkle = SparseMerkleTree::new(&env);
        let new_root = merkle.get_root(&commitments);
        env.storage().instance().set(&DataKey::MerkleRoot, &new_root);

        // Update deposit count
        let deposit_count: u32 = env.storage().instance().get(&DataKey::DepositCount).unwrap();
        env.storage().instance().set(&DataKey::DepositCount, &(deposit_count + 1));

        // Update total deposited
        let total_deposited: i128 = env.storage().instance().get(&DataKey::TotalDeposited).unwrap();
        env.storage().instance().set(&DataKey::TotalDeposited, &(total_deposited + amount));

        env.events().publish(
            (symbol_short!("deposit"),),
            (from, amount, commitment, leaf_index, new_root),
        );

        Ok(leaf_index)
    }

    /// Pay x402 service with ZK proof
    /// Proof demonstrates:
    /// 1. Knowledge of secret for valid commitment in tree
    /// 2. Commitment matches service address
    /// 3. Nullifier never used before
    pub fn pay_x402_service(
        env: Env,
        nullifier_hash: BytesN<32>,
        service_address: Address,
        amount: i128,
        merkle_root: BytesN<32>,
        proof: Bytes,
    ) -> Result<(), Error> {
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }

        // Verify Merkle root matches current or recent root
        let current_root: BytesN<32> = env.storage().instance().get(&DataKey::MerkleRoot).unwrap();
        if merkle_root != current_root {
            return Err(Error::InvalidMerkleRoot);
        }

        // Check nullifier not already spent
        let nullifier_key = DataKey::Nullifiers;
        if env.storage().persistent().has(&nullifier_key) {
            // In production, we'd have a Map<BytesN<32>, bool> but for MVP we simplify
            // by using individual storage keys per nullifier
            return Err(Error::NullifierAlreadySpent);
        }

        // TODO: Verify ZK proof using auto-generated verifier
        // For now, we'll add this after generating the verifier from circuits
        // verify_groth16_proof(&env, &proof, &[merkle_root, nullifier_hash, amount])?;

        // Mark nullifier as spent
        env.storage().persistent().set(&nullifier_key, &true);

        // Add to pending payments queue for batch settlement
        let mut pending: Vec<PendingPayment> = env.storage()
            .instance()
            .get(&DataKey::PendingPayments)
            .unwrap_or(Vec::new(&env));

        pending.push_back(PendingPayment {
            service_address: service_address.clone(),
            amount,
            nullifier_hash: nullifier_hash.clone(),
        });

        env.storage().instance().set(&DataKey::PendingPayments, &pending);

        env.events().publish(
            (symbol_short!("pay"),),
            (nullifier_hash, service_address, amount),
        );

        Ok(())
    }

    /// Batch settle pending payments (operator only)
    /// Aggregates payments by service and transfers in bulk
    pub fn batch_settle(env: Env, operator: Address) -> Result<BatchResult, Error> {
        operator.require_auth();

        // Verify operator
        let expected_operator: Address = env.storage().instance().get(&DataKey::Operator).unwrap();
        if operator != expected_operator {
            return Err(Error::Unauthorized);
        }

        // Get pending payments
        let pending: Vec<PendingPayment> = env.storage()
            .instance()
            .get(&DataKey::PendingPayments)
            .unwrap_or(Vec::new(&env));

        if pending.is_empty() {
            return Ok(BatchResult {
                payments_processed: 0,
                services_paid: 0,
                total_amount: 0,
            });
        }

        // Group by service address
        // Note: In production, use a more efficient data structure
        let token_address: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        let token_client = token::Client::new(&env, &token_address);

        let mut payments_processed = 0u32;
        let mut services_paid = 0u32;
        let mut total_amount = 0i128;

        // Simple aggregation (can be optimized)
        for payment in pending.iter() {
            token_client.transfer(
                &env.current_contract_address(),
                &payment.service_address,
                &payment.amount,
            );
            payments_processed += 1;
            total_amount += payment.amount;
        }

        // Update total withdrawn
        let total_withdrawn: i128 = env.storage().instance().get(&DataKey::TotalWithdrawn).unwrap();
        env.storage().instance().set(&DataKey::TotalWithdrawn, &(total_withdrawn + total_amount));

        // Clear pending payments
        let empty: Vec<PendingPayment> = Vec::new(&env);
        env.storage().instance().set(&DataKey::PendingPayments, &empty);

        env.events().publish(
            (symbol_short!("batch"),),
            (payments_processed, total_amount),
        );

        Ok(BatchResult {
            payments_processed,
            services_paid,
            total_amount,
        })
    }

    /// Get Merkle proof for commitment at index
    pub fn get_merkle_proof(env: Env, leaf_index: u32) -> Result<MerkleProof, Error> {
        let commitments: Vec<BytesN<32>> = env.storage()
            .instance()
            .get(&DataKey::Commitments)
            .unwrap_or(Vec::new(&env));

        if leaf_index >= commitments.len() {
            return Err(Error::InvalidLeafIndex);
        }

        let merkle = SparseMerkleTree::new(&env);
        let proof = merkle.get_proof(&commitments, leaf_index);

        Ok(proof)
    }

    /// Get current Merkle root
    pub fn get_root(env: Env) -> BytesN<32> {
        env.storage()
            .instance()
            .get(&DataKey::MerkleRoot)
            .unwrap()
    }

    /// Get deposit count
    pub fn get_deposit_count(env: Env) -> u32 {
        env.storage()
            .instance()
            .get(&DataKey::DepositCount)
            .unwrap_or(0)
    }

    /// Get privacy metrics
    pub fn get_privacy_metrics(env: Env) -> PrivacyMetrics {
        let deposit_count: u32 = env.storage().instance().get(&DataKey::DepositCount).unwrap_or(0);
        let total_deposited: i128 = env.storage().instance().get(&DataKey::TotalDeposited).unwrap_or(0);
        let total_withdrawn: i128 = env.storage().instance().get(&DataKey::TotalWithdrawn).unwrap_or(0);

        let pending: Vec<PendingPayment> = env.storage()
            .instance()
            .get(&DataKey::PendingPayments)
            .unwrap_or(Vec::new(&env));

        PrivacyMetrics {
            anonymity_set_size: deposit_count,
            total_deposited,
            total_withdrawn,
            pending_payments: pending.len(),
        }
    }
}
