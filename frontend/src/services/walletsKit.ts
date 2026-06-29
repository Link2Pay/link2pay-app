// Stellar Wallets Kit (v2) — broadens payer wallet support beyond Freighter
// (xBull, Albedo, Rabet, Lobstr, Hana, WalletConnect, …) behind one modal.
// Used on the payer off-ramp flow; the rest of the app keeps using Freighter.
import { StellarWalletsKit } from '@creit.tech/stellar-wallets-kit/sdk';
import { defaultModules } from '@creit.tech/stellar-wallets-kit/modules/utils';
import { Networks } from '@creit.tech/stellar-wallets-kit/types';

let initialized = false;

function ensureInit(networkPassphrase: string): void {
  if (initialized) return;
  StellarWalletsKit.init({
    modules: defaultModules(),
    network: networkPassphrase.includes('Test') ? Networks.TESTNET : Networks.PUBLIC,
  });
  initialized = true;
}

/** Render the Kit's connect button into a container element. */
export async function kitMountButton(el: HTMLElement, networkPassphrase: string): Promise<void> {
  ensureInit(networkPassphrase);
  await StellarWalletsKit.createButton(el);
}

/** Currently connected address, or null if no wallet is selected yet. */
export async function kitGetAddress(): Promise<string | null> {
  try {
    const { address } = await StellarWalletsKit.getAddress();
    return address || null;
  } catch {
    return null;
  }
}

/** Sign an XDR with the connected wallet; returns the signed XDR. */
export async function kitSign(xdr: string, networkPassphrase: string): Promise<string> {
  ensureInit(networkPassphrase);
  const address = await kitGetAddress();
  if (!address) throw new Error('No wallet connected');
  const { signedTxXdr } = await StellarWalletsKit.signTransaction(xdr, {
    networkPassphrase,
    address,
  });
  return signedTxXdr;
}
