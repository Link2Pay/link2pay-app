#!/usr/bin/env node
import { readFile } from 'fs/promises';
import { groth16 } from 'snarkjs';

// Test proof generation with sample inputs
async function testProof() {
    console.log('Testing x402 payment proof generation...\n');

    // Sample inputs
    const input = {
        // Private inputs
        amount: "1000000000",              // 100 XLM (7 decimals)
        secret: "123456789",               // Random secret
        nullifier: "987654321",            // Unique nullifier
        pathElements: Array(10).fill("0"), // Empty Merkle proof
        pathIndices: Array(10).fill(0),    // All left

        // Public inputs
        recipientWallet: "1234567890123456789012345678901234567890", // Stellar address as number
        paymentAmount: "10000000",         // 1 XLM payment
        merkleRoot: "0",                   // Root of empty tree
    };

    try {
        console.log('Generating witness...');
        const { proof, publicSignals } = await groth16.fullProve(
            input,
            'build/x402_payment_js/x402_payment.wasm',
            'keys/x402_payment_final.zkey'
        );

        console.log('✓ Proof generated successfully!\n');
        console.log('Public signals:');
        console.log('  recipientWallet:', publicSignals[0]);
        console.log('  paymentAmount:', publicSignals[1]);
        console.log('  merkleRoot:', publicSignals[2]);
        console.log('  nullifierHash:', publicSignals[3]);
        console.log();

        // Verify proof
        console.log('Verifying proof...');
        const vkey = JSON.parse(await readFile('keys/verification_key.json', 'utf-8'));
        const verified = await groth16.verify(vkey, publicSignals, proof);

        if (verified) {
            console.log('✓ Proof verified successfully!');
        } else {
            console.log('✗ Proof verification failed');
            process.exit(1);
        }

    } catch (error) {
        console.error('✗ Error:', error.message);
        process.exit(1);
    }
}

testProof();
