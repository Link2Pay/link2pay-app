import { describe, it, expect, vi, afterEach } from 'vitest';
import { ScanSessionService } from './scanSessionService';

const WALLET = 'GBUMVWB7KO2R25AJHZP6V3HI4PNQNBNNZIR4BJMPN2NUZZN5ER3IQMO3';

describe('ScanSessionService', () => {
  afterEach(() => vi.useRealTimers());

  it('creates sessions with unique, url-safe tokens and a 5-minute expiry', () => {
    const svc = new ScanSessionService();
    const a = svc.create(WALLET);
    const b = svc.create(WALLET);
    expect(a.token).not.toBe(b.token);
    expect(a.token).toMatch(/^[A-Za-z0-9_-]{40,}$/);
    expect(a.expiresAt).toBeGreaterThan(Date.now() + 4 * 60_000);
  });

  it('relays a llave exactly once to the owning wallet', () => {
    const svc = new ScanSessionService();
    const { token } = svc.create(WALLET);
    expect(svc.take(token, WALLET)).toEqual({ status: 'pending' });
    expect(svc.submitResult(token, '@nequi-3001234567')).toBe('ok');
    expect(svc.take(token, WALLET)).toEqual({ status: 'ready', llave: '@nequi-3001234567' });
    // single delivery: the session is consumed
    expect(svc.take(token, WALLET)).toEqual({ status: 'gone' });
  });

  it('rejects a second submit', () => {
    const svc = new ScanSessionService();
    const { token } = svc.create(WALLET);
    svc.submitResult(token, 'first');
    expect(svc.submitResult(token, 'second')).toBe('already_set');
  });

  it('hides sessions from other wallets', () => {
    const svc = new ScanSessionService();
    const { token } = svc.create(WALLET);
    expect(svc.take(token, 'GOTHERWALLET')).toEqual({ status: 'gone' });
    // and the owner can still use it afterwards
    expect(svc.take(token, WALLET)).toEqual({ status: 'pending' });
  });

  it('expires sessions after the TTL', () => {
    vi.useFakeTimers();
    const svc = new ScanSessionService();
    const { token } = svc.create(WALLET);
    vi.advanceTimersByTime(5 * 60_000 + 1000);
    expect(svc.submitResult(token, 'x')).toBe('expired');
    expect(svc.take(token, WALLET)).toEqual({ status: 'gone' });
  });

  it('unknown token: not_found / gone', () => {
    const svc = new ScanSessionService();
    expect(svc.submitResult('nope', 'x')).toBe('not_found');
    expect(svc.take('nope', WALLET)).toEqual({ status: 'gone' });
  });
});
