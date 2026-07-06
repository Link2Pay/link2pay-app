// Stellar Wallets Kit (v2) — broadens payer wallet support beyond Freighter
// (xBull, Albedo, Rabet, Lobstr, Hana, WalletConnect, …).
// The wallet roller on the payer flow builds its list from the Kit module registry.
import { StellarWalletsKit } from '@creit.tech/stellar-wallets-kit/sdk';
import { defaultModules } from '@creit.tech/stellar-wallets-kit/modules/utils';
import {
  WalletConnectModule,
  WalletConnectTargetChain,
} from '@creit.tech/stellar-wallets-kit/modules/wallet-connect';
import { Networks } from '@creit.tech/stellar-wallets-kit/types';
import type { ModuleInterface } from '@creit.tech/stellar-wallets-kit/types';
import { config } from '../config';

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

// UA-based (not viewport-based) detection: what matters for WalletConnect is
// whether the device can deep-link into a native wallet app, not its width.
// Deliberately no coarse-pointer fallback — a touch laptop is still a desktop
// with extensions.
function isLikelyMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  const nav = navigator as Navigator & { userAgentData?: { mobile?: boolean } };
  if (typeof nav.userAgentData?.mobile === 'boolean') return nav.userAgentData.mobile;
  return /Android|iPhone|iPad|iPod|IEMobile|Opera Mini/i.test(navigator.userAgent || '');
}

// WalletConnect is offered ONLY on mobile: on desktop every supported wallet
// is reachable through its extension, while on a mobile browser no extension
// exists and WC deep-links into the native apps instead. Of the Stellar
// wallets registered with WalletConnect, Freighter supports pubnet + testnet
// and LOBSTR is pubnet-only — on testnet only Freighter will complete the
// handshake. Requires a Reown project ID; without it the module is skipped.
function walletConnectModule(networkPassphrase: string): ModuleInterface | null {
  if (!config.walletConnectProjectId || !isLikelyMobileDevice()) return null;
  const origin = window.location.origin;
  return new WalletConnectModule({
    projectId: config.walletConnectProjectId,
    metadata: {
      name: config.appName,
      description: 'Stellar payment links — pay invoices in USDC/XLM.',
      url: origin,
      icons: [`${origin}/link2pay-favicon.png`],
    },
    allowedChains: [
      networkPassphrase.includes('Test')
        ? WalletConnectTargetChain.TESTNET
        : WalletConnectTargetChain.PUBLIC,
    ],
  });
}

function paymentModules(networkPassphrase: string): ModuleInterface[] {
  const modules = defaultModules({ filterBy: (m) => MULTIPLATFORM_WALLET_IDS.has(m.productId) });
  const wc = walletConnectModule(networkPassphrase);
  if (wc) modules.push(wc);
  return modules;
}

let initialized = false;
let _modules: ModuleInterface[] = [];

function ensureInit(networkPassphrase: string): void {
  if (initialized) return;
  _modules = paymentModules(networkPassphrase);
  StellarWalletsKit.init({
    modules: _modules,
    network: networkPassphrase.includes('Test') ? Networks.TESTNET : Networks.PUBLIC,
  });
  initialized = true;
}

/** Return the module registry so the roller can build its card list. */
export function getKitModules(networkPassphrase: string): ModuleInterface[] {
  ensureInit(networkPassphrase);
  return _modules;
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
