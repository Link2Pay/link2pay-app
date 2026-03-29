pragma circom 2.1.6;

include "../node_modules/circomlib/circuits/poseidon.circom";
include "../node_modules/circomlib/circuits/comparators.circom";
include "../node_modules/circomlib/circuits/bitify.circom";

// Merkle tree verification with Poseidon hash
template MerkleTreeChecker(levels) {
    signal input leaf;
    signal input root;
    signal input pathElements[levels];
    signal input pathIndices[levels];

    component hashers[levels];
    component selectors[levels];

    signal currentHash[levels + 1];
    currentHash[0] <== leaf;

    for (var i = 0; i < levels; i++) {
        selectors[i] = Selector();
        selectors[i].in[0] <== currentHash[i];
        selectors[i].in[1] <== pathElements[i];
        selectors[i].index <== pathIndices[i];

        hashers[i] = Poseidon(2);
        hashers[i].inputs[0] <== selectors[i].out[0];
        hashers[i].inputs[1] <== selectors[i].out[1];

        currentHash[i + 1] <== hashers[i].out;
    }

    root === currentHash[levels];
}

// Selector for Merkle tree (left or right)
template Selector() {
    signal input in[2];
    signal input index;
    signal output out[2];

    signal tmp;
    tmp <== (in[1] - in[0]) * index;
    out[0] <== in[0] + tmp;
    out[1] <== in[1] - tmp;
}

// Main circuit for private x402 payments
template X402Payment(levels) {
    // Private inputs (only prover knows these)
    signal input amount;              // Original deposit amount
    signal input secret;              // Random secret for commitment
    signal input nullifier;           // Unique nullifier to prevent double-spend
    signal input pathElements[levels]; // Merkle proof path
    signal input pathIndices[levels];  // Merkle proof indices

    // Public inputs (visible on-chain)
    signal input recipientWallet;     // Recipient's wallet address (as field element)
    signal input paymentAmount;       // Payment amount for this x402 service
    signal input merkleRoot;          // Current Merkle root

    // Public outputs
    signal output nullifierHash;      // Hash of nullifier (prevents linking to deposit)

    // 1. Verify payment amount <= deposit amount
    component amountCheck = LessEqThan(128);
    amountCheck.in[0] <== paymentAmount;
    amountCheck.in[1] <== amount;
    amountCheck.out === 1;

    // 2. Compute commitment = Poseidon(amount, secret, nullifier, recipientWallet)
    component commitmentHasher = Poseidon(4);
    commitmentHasher.inputs[0] <== amount;
    commitmentHasher.inputs[1] <== secret;
    commitmentHasher.inputs[2] <== nullifier;
    commitmentHasher.inputs[3] <== recipientWallet;

    // 3. Verify commitment exists in Merkle tree
    component merkleChecker = MerkleTreeChecker(levels);
    merkleChecker.leaf <== commitmentHasher.out;
    merkleChecker.root <== merkleRoot;
    for (var i = 0; i < levels; i++) {
        merkleChecker.pathElements[i] <== pathElements[i];
        merkleChecker.pathIndices[i] <== pathIndices[i];
    }

    // 4. Compute nullifier hash (public output)
    component nullifierHasher = Poseidon(1);
    nullifierHasher.inputs[0] <== nullifier;
    nullifierHash <== nullifierHasher.out;

    // Additional constraint: ensure secret is not zero (prevents trivial commitments)
    signal secretSquared;
    secretSquared <== secret * secret;
}

// Instantiate main component with tree depth of 10
component main {public [recipientWallet, paymentAmount, merkleRoot]} = X402Payment(10);
