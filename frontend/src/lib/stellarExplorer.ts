import { config } from '../config';

/**
 * stellar.expert explorer URL for a transaction or account.
 * Network comes from the invoice's networkPassphrase when known (payment may
 * have settled on a different network than the app default), otherwise from
 * the app's resolved network.
 */
export function stellarExpertUrl(
  kind: 'tx' | 'account',
  value: string,
  networkPassphrase?: string | null,
): string {
  const testnet = networkPassphrase
    ? networkPassphrase.includes('Test')
    : config.stellarNetwork === 'testnet';
  return `https://stellar.expert/explorer/${testnet ? 'testnet' : 'public'}/${kind}/${value}`;
}
