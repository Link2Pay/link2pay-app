import { TransactionBuilder, Account, Operation } from '@stellar/stellar-sdk';
import { useNetworkStore } from '../store/networkStore';

type AcceslySignFn = (xdr: string) => Promise<{ signedXdr: string }>;

// ─── Signer Registry ──────────────────────────────────────────────────────────
// Holds a reference to Accesly's signTransaction function, registered by the
// AcceslySync component when the wallet connects and cleared on disconnect.
// This lets api.ts (a plain module, not a React component) sign auth nonces.

let _signFn: AcceslySignFn | null = null;

export function registerAcceslySigner(fn: AcceslySignFn): void {
  _signFn = fn;
}

export function unregisterAcceslySigner(): void {
  _signFn = null;
}

export function getAcceslySigner(): AcceslySignFn | null {
  return _signFn;
}

/**
 * Signs the auth nonce using Accesly's signTransaction.
 *
 * Builds a Stellar manageData transaction containing the nonce, signs it via
 * Accesly, and returns the signed XDR (base64 string).
 *
 * The backend verifies by:
 *  1. Parsing the XDR and checking the source account matches the wallet address
 *  2. Confirming the manageData operation carries the expected nonce
 *  3. Verifying the Stellar ed25519 transaction signature
 *
 * Using setTimeout(300) keeps the transaction structurally valid.
 * The transaction is never submitted to Horizon — signing only.
 */
export async function signNonceWithAccesly(
  walletAddress: string,
  nonce: string
): Promise<string> {
  const signFn = _signFn;
  if (!signFn) {
    throw new Error('Accesly signer not available. Please reconnect your account.');
  }

  const { networkPassphrase } = useNetworkStore.getState();

  // Fixed sequence '0' → transaction gets sequence 1 after build().
  // manageData value = nonce (32 hex chars = 32 UTF-8 bytes, within 64-byte limit).
  const account = new Account(walletAddress, '0');
  const tx = new TransactionBuilder(account, {
    fee: '100',
    networkPassphrase,
  })
    .addOperation(
      Operation.manageData({
        name: 'link2pay-auth',
        value: nonce,
      })
    )
    .setTimeout(300)
    .build();

  const { signedXdr } = await signFn(tx.toXDR());
  return signedXdr; // base64 XDR — sent as x-auth-signature header value
}
