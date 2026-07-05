// Stellar Wallets Kit (v2) — broadens payer wallet support beyond Freighter
// (xBull, Albedo, Rabet, Lobstr, Hana, WalletConnect, …).
// The wallet roller on the payer flow builds its list from the Kit module registry.
import { StellarWalletsKit } from '@creit.tech/stellar-wallets-kit/sdk';
import { defaultModules } from '@creit.tech/stellar-wallets-kit/modules/utils';
import { Networks } from '@creit.tech/stellar-wallets-kit/types';
import type { ModuleInterface } from '@creit.tech/stellar-wallets-kit/types';

let initialized = false;
let _modules: ModuleInterface[] = [];

function ensureInit(networkPassphrase: string): void {
  if (initialized) return;
  _modules = defaultModules();
  StellarWalletsKit.init({
    modules: _modules,
    network: networkPassphrase.includes('Test') ? Networks.TESTNET : Networks.PUBLIC,
  });
  initialized = true;
}

/** Return the module registry so the roller can build its card list. */
export function getKitModules(): ModuleInterface[] {
  return _modules.length > 0 ? _modules : defaultModules();
}

/** Render the Kit's connect button into a container element. */
export async function kitMountButton(el: HTMLElement, networkPassphrase: string): Promise<void> {
  ensureInit(networkPassphrase);
  await StellarWalletsKit.createButton(el);
}

/** Select a wallet by module id; must be called before getAddress/sign. */
export function kitSetWallet(id: string, networkPassphrase: string): void {
  ensureInit(networkPassphrase);
  StellarWalletsKit.setWallet(id);
}

/** Currently connected address, or null if no wallet is selected yet. */
export async function kitGetAddress(networkPassphrase?: string): Promise<string | null> {
  if (networkPassphrase) ensureInit(networkPassphrase);
  try {
    const { address } = await StellarWalletsKit.getAddress();
    return address || null;
  } catch {
    return null;
  }
}

/** Get the network from the Kit-connected wallet. */
export async function kitGetNetwork(): Promise<{ network: string; networkPassphrase: string } | null> {
  try {
    return await StellarWalletsKit.getNetwork();
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

/** Sign an XDR for a specific address (payer flow — address is page-local). */
export async function kitSignWith(address: string, xdr: string, networkPassphrase: string): Promise<string> {
  ensureInit(networkPassphrase);
  const { signedTxXdr } = await StellarWalletsKit.signTransaction(xdr, {
    networkPassphrase,
    address,
  });
  return signedTxXdr;
}
