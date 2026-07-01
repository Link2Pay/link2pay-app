import { Transaction, xdr, Keypair } from '@stellar/stellar-sdk';
import type { ExternalSigner } from '../store/walletStore';

type SignRawHashFn = (input: {
  address: string;
  chainType: 'stellar';
  hash: `0x${string}`;
}) => Promise<{ signature: `0x${string}` }>;

async function sha256Hex(data: Uint8Array): Promise<`0x${string}`> {
  const buf = await globalThis.crypto.subtle.digest('SHA-256', data.buffer as ArrayBuffer);
  const hex = Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `0x${hex}`;
}

/**
 * Build an ExternalSigner that routes through Privy's signRawHash for a
 * Stellar embedded wallet. Call this inside a React component/effect where
 * the hook result is available, then pass the returned object to
 * walletStore.setExternalWallet().
 */
export function buildPrivySigner(address: string, signRawHash: SignRawHashFn): ExternalSigner {
  return {
    async signTransaction(transactionXdr: string, networkPassphrase: string): Promise<string> {
      const tx = new Transaction(transactionXdr, networkPassphrase);

      // Stellar signs the 32-byte transaction hash directly (not SHA-256 of XDR)
      const hashBytes = tx.hash();
      const rawHex = Array.from(hashBytes as Uint8Array)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
      const hash = `0x${rawHex}` as `0x${string}`;

      const { signature } = await signRawHash({ address, chainType: 'stellar', hash });

      // Convert 0x-prefixed hex signature to bytes
      const sigHex = signature.startsWith('0x') ? signature.slice(2) : signature;
      const sigBytes = new Uint8Array((sigHex.match(/.{2}/g) ?? []).map((b) => parseInt(b, 16)));

      const keypair = Keypair.fromPublicKey(address);
      const hint = keypair.signatureHint();

      tx.signatures.push(
        new xdr.DecoratedSignature({
          hint: Buffer.from(hint),
          signature: Buffer.from(sigBytes),
        })
      );

      return tx.toXDR();
    },

    async signMessage(message: string): Promise<string> {
      // Backend verifies ed25519(sha256(message)) for Privy-signed nonces
      const msgBytes = new TextEncoder().encode(message);
      const hash = await sha256Hex(msgBytes);

      const { signature } = await signRawHash({ address, chainType: 'stellar', hash });
      return signature.startsWith('0x') ? signature.slice(2) : signature;
    },
  };
}
