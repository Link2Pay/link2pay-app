// Stellar Wallets Kit (v2) — broadens payer wallet support beyond Freighter
// (xBull, Albedo, Rabet, Lobstr, Hana, WalletConnect, …).
// The wallet roller on the payer flow builds its list from the Kit module registry.
import { StellarWalletsKit } from '@creit.tech/stellar-wallets-kit/sdk';
import { defaultModules } from '@creit.tech/stellar-wallets-kit/modules/utils';
import { Networks } from '@creit.tech/stellar-wallets-kit/types';
import type { ModuleInterface } from '@creit.tech/stellar-wallets-kit/types';

// Payment wallets must work everywhere a payment link opens: browser
// extension on desktop AND a native mobile app. Excluded from the kit's
// defaults: albedo (web-only), rabet (mobile effectively unmaintained),
// fordefi + cactuslink (institutional custody, not consumer payers).
const MULTIPLATFORM_WALLET_IDS = new Set([
  'freighter', // extension + mobile app
  'xbull', // extension + iOS/Android
  'lobstr', // mobile app + signer extension
  'hana', // extension + mobile app
  'klever', // mobile app + extension
  'onekey', // extension + mobile app
  'BitgetWallet', // extension + mobile app
]);

function paymentModules(): ModuleInterface[] {
  return defaultModules({ filterBy: (m) => MULTIPLATFORM_WALLET_IDS.has(m.productId) });
}

let initialized = false;
let _modules: ModuleInterface[] = [];

function ensureInit(networkPassphrase: string): void {
  if (initialized) return;
  _modules = paymentModules();
  StellarWalletsKit.init({
    modules: _modules,
    network: networkPassphrase.includes('Test') ? Networks.TESTNET : Networks.PUBLIC,
  });
  initialized = true;
}

/** Return the module registry so the roller can build its card list. */
export function getKitModules(): ModuleInterface[] {
  return _modules.length > 0 ? _modules : paymentModules();
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

/**
 * Address of the connected wallet, or null if none is connected yet.
 * Uses fetchAddress (not getAddress) because getAddress only reads the Kit's
 * in-memory cache, which is empty until fetchAddress has actually asked the
 * module/extension for the address at least once.
 */
export async function kitGetAddress(networkPassphrase?: string): Promise<string | null> {
  if (networkPassphrase) ensureInit(networkPassphrase);
  try {
    const { address } = await StellarWalletsKit.fetchAddress();
    return address || null;
  } catch (err) {
    console.error('[walletsKit] getAddress failed:', err);
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
