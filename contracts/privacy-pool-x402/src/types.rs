use soroban_sdk::{contracttype, Address, BytesN, Vec, Env};

#[derive(Clone, Debug, Eq, PartialEq)]
#[contracttype]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    Unauthorized = 3,
    InvalidAmount = 4,
    InvalidMerkleRoot = 5,
    InvalidProof = 6,
    NullifierAlreadySpent = 7,
    TreeFull = 8,
    InvalidLeafIndex = 9,
}

#[derive(Clone, Debug, Eq, PartialEq)]
#[contracttype]
pub struct PendingPayment {
    pub service_address: Address,
    pub amount: i128,
    pub nullifier_hash: BytesN<32>,
}

#[derive(Clone, Debug, Eq, PartialEq)]
#[contracttype]
pub struct BatchResult {
    pub payments_processed: u32,
    pub services_paid: u32,
    pub total_amount: i128,
}

#[derive(Clone, Debug, Eq, PartialEq)]
#[contracttype]
pub struct MerkleProof {
    pub leaf: BytesN<32>,
    pub path_elements: Vec<BytesN<32>>,
    pub path_indices: Vec<bool>,
}

#[derive(Clone, Debug, Eq, PartialEq)]
#[contracttype]
pub struct PrivacyMetrics {
    pub anonymity_set_size: u32,
    pub total_deposited: i128,
    pub total_withdrawn: i128,
    pub pending_payments: u32,
}
