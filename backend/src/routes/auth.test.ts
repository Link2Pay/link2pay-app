import { describe, it, expect, vi, beforeEach } from 'vitest';
import crypto from 'crypto';

// Test the Privy session wallet-binding logic directly on the AuthService
// class, and verify the route access-control contract through unit tests
// on the individual service methods.

import { AuthService } from '../services/authService';

function mockFetchResponse(status: number, body: any) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

const WALLET_A = 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN';
const WALLET_B = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';
const APP_ID = 'test-app-id';
const APP_SECRET = 'test-app-secret';

describe('Privy wallet binding (SEC-01)', () => {
  let service: AuthService;

  beforeEach(() => {
    service = new AuthService();
    vi.restoreAllMocks();
  });

  describe('fetchPrivyLinkedWallets', () => {
    it('returns wallet addresses from a successful Privy API response', async () => {
      const mockFetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        mockFetchResponse(200, {
          linked_accounts: [
            { type: 'wallet', address: WALLET_A, chain: 'stellar' },
            { type: 'email', address: 'test@example.com' },
            { type: 'wallet', address: WALLET_B },
          ],
        })
      );

      const result = await service.fetchPrivyLinkedWallets(
        'did:privy:user-1',
        APP_ID,
        APP_SECRET
      );

      expect(result).toEqual([WALLET_A, WALLET_B]);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://auth.privy.io/api/v1/users/did%3Aprivy%3Auser-1',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: expect.stringContaining('Basic'),
          }),
        })
      );
    });

    it('returns null when the Privy API returns non-200', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        mockFetchResponse(404, { error: 'Not found' })
      );

      const result = await service.fetchPrivyLinkedWallets(
        'did:privy:unknown',
        APP_ID,
        APP_SECRET
      );

      expect(result).toBeNull();
    });

    it('returns null when fetch throws (network error)', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('ECONNREFUSED'));

      const result = await service.fetchPrivyLinkedWallets(
        'did:privy:user-1',
        APP_ID,
        APP_SECRET
      );

      expect(result).toBeNull();
    });

    it('returns empty array when user has no linked wallets', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        mockFetchResponse(200, { linked_accounts: [] })
      );

      const result = await service.fetchPrivyLinkedWallets(
        'did:privy:user-1',
        APP_ID,
        APP_SECRET
      );

      expect(result).toEqual([]);
    });

    it('filters non-Stellar wallet entries', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        mockFetchResponse(200, {
          linked_accounts: [
            { type: 'email', address: 'test@example.com' },
            { type: 'phone', address: '+1234567890' },
            { address: 'no-type-here' },
          ],
        })
      );

      const result = await service.fetchPrivyLinkedWallets(
        'did:privy:user-1',
        APP_ID,
        APP_SECRET
      );

      expect(result).toEqual([]);
    });

    it('handles unexpected API response shape safely', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        mockFetchResponse(200, { unexpected: 'shape' })
      );

      const result = await service.fetchPrivyLinkedWallets(
        'did:privy:user-1',
        APP_ID,
        APP_SECRET
      );

      expect(result).toEqual([]);
    });
  });

  describe('verifyPrivyToken', () => {
    it('rejects a completely fake token', async () => {
      const result = await service.verifyPrivyToken('not.a.real.jwt', APP_ID);
      expect(result).toBeNull();
    });

    it('rejects a token with wrong issuer', async () => {
      // Build a fake ES256-signed JWT with iss=evil.com
      const header = Buffer.from(JSON.stringify({ alg: 'ES256', typ: 'JWT' })).toString('base64url');
      const payload = Buffer.from(
        JSON.stringify({
          iss: 'evil.com',
          aud: [APP_ID],
          exp: Math.floor(Date.now() / 1000) + 3600,
          sub: 'did:privy:evil',
        })
      ).toString('base64url');
      const fakeToken = `${header}.${payload}.invalid_sig`;

      const result = await service.verifyPrivyToken(fakeToken, APP_ID);
      expect(result).toBeNull();
    });

    it('rejects an expired token (without checking signature)', async () => {
      const header = Buffer.from(JSON.stringify({ alg: 'ES256' })).toString('base64url');
      const payload = Buffer.from(
        JSON.stringify({
          iss: 'privy.io',
          aud: [APP_ID],
          exp: 1, // expired in 1970
          sub: 'did:privy:expired',
        })
      ).toString('base64url');
      const expiredToken = `${header}.${payload}.signature`;

      const result = await service.verifyPrivyToken(expiredToken, APP_ID);
      expect(result).toBeNull();
    });

    it('rejects a token whose aud does not include the app id', async () => {
      const header = Buffer.from(JSON.stringify({ alg: 'ES256' })).toString('base64url');
      const payload = Buffer.from(
        JSON.stringify({
          iss: 'privy.io',
          aud: ['wrong-app-id'],
          exp: Math.floor(Date.now() / 1000) + 3600,
          sub: 'did:privy:user',
        })
      ).toString('base64url');
      const wrongAudToken = `${header}.${payload}.signature`;

      const result = await service.verifyPrivyToken(wrongAudToken, APP_ID);
      expect(result).toBeNull();
    });

    it('rejects a token with missing sub', async () => {
      const header = Buffer.from(JSON.stringify({ alg: 'ES256' })).toString('base64url');
      const payload = Buffer.from(
        JSON.stringify({
          iss: 'privy.io',
          aud: [APP_ID],
          exp: Math.floor(Date.now() / 1000) + 3600,
        })
      ).toString('base64url');
      const noSubToken = `${header}.${payload}.signature`;

      const result = await service.verifyPrivyToken(noSubToken, APP_ID);
      expect(result).toBeNull();
    });
  });

  describe('session token issuance', () => {
    it('issueSessionToken returns a unique token', () => {
      const a = service.issueSessionToken(WALLET_A);
      const b = service.issueSessionToken(WALLET_B);

      expect(a.sessionToken).not.toBe(b.sessionToken);
      expect(a.sessionToken.length).toBe(64); // 32 random bytes in hex
      expect(a.expiresIn).toBe(1800);
    });

    it('verifySessionToken returns wallet address for valid token', () => {
      const { sessionToken } = service.issueSessionToken(WALLET_A);
      const wallet = service.verifySessionToken(sessionToken);

      expect(wallet).toBe(WALLET_A);
    });

    it('verifySessionToken returns null for unknown token', () => {
      const wallet = service.verifySessionToken('invalid-token');
      expect(wallet).toBeNull();
    });
  });
});
