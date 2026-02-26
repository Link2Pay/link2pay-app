import crypto from 'crypto';
import * as StellarSdk from '@stellar/stellar-sdk';

async function main() {
  const kp = StellarSdk.Keypair.random();
  const walletAddress = kp.publicKey();

  // Issue nonce
  const nonceRes = await fetch('http://localhost:3001/api/auth/nonce', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ walletAddress })
  });
  const { nonce, message } = await nonceRes.json();

  // Sign it
  const signature = kp.sign(Buffer.from(message, 'utf8'));
  const signatureHex = signature.toString('hex');

  const headers = {
    'x-wallet-address': walletAddress,
    'x-auth-nonce': nonce,
    'x-auth-signature': signatureHex
  };

  // call concurrent
  const [res1, res2] = await Promise.all([
    fetch('http://localhost:3001/api/invoices/stats', { headers }),
    fetch('http://localhost:3001/api/invoices?limit=50&offset=0', { headers })
  ]);

  console.log('stats:', res1.status, await res1.text());
  console.log('list:', res2.status, await res2.text());
}
main().catch(console.error);
