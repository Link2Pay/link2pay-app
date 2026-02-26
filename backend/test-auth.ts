import crypto from 'crypto';
import * as StellarSdk from '@stellar/stellar-sdk';
import { authService } from './src/services/authService';

const kp = StellarSdk.Keypair.random();
const walletAddress = kp.publicKey();

// Issue nonce
const nonce = authService.issueNonce(walletAddress);
const message = authService.buildMessage(walletAddress, nonce);

// Sign it
const signature = kp.sign(Buffer.from(message, 'utf8'));
const signatureHex = signature.toString('hex');

// Verify 1st time
const valid1 = authService.verifySignature(walletAddress, nonce, signatureHex);
console.log('1st verification:', valid1);

// Verify 2nd time
const valid2 = authService.verifySignature(walletAddress, nonce, signatureHex);
console.log('2nd verification:', valid2);
