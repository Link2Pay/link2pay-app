//
// Ephemeral scan sessions for the "continue on phone" Bre-B QR handoff.
// Desktop (authenticated) creates a token; the phone (anonymous, token is the
// credential) attaches the scanned llave; desktop polls and receives it once.
// In-memory on purpose: sessions are 5-minute ephemera, not data — a redeploy
// mid-scan just means rescanning. See the handoff spec for the threat model.
import { randomBytes } from 'crypto';

const TTL_MS = 5 * 60 * 1000;
const SWEEP_MS = 60 * 1000;

interface ScanSession {
  walletAddress: string;
  llave: string | null;
  expiresAt: number;
}

export class ScanSessionService {
  private sessions = new Map<string, ScanSession>();

  constructor() {
    const sweeper = setInterval(() => {
      const now = Date.now();
      for (const [token, s] of this.sessions) {
        if (s.expiresAt < now) this.sessions.delete(token);
      }
    }, SWEEP_MS);
    sweeper.unref?.();
  }

  create(walletAddress: string): { token: string; expiresAt: number } {
    const token = randomBytes(32).toString('base64url');
    const expiresAt = Date.now() + TTL_MS;
    this.sessions.set(token, { walletAddress, llave: null, expiresAt });
    return { token, expiresAt };
  }

  submitResult(token: string, llave: string): 'ok' | 'not_found' | 'expired' | 'already_set' {
    const session = this.sessions.get(token);
    if (!session) return 'not_found';
    if (session.expiresAt <= Date.now()) {
      this.sessions.delete(token);
      return 'expired';
    }
    if (session.llave !== null) return 'already_set';
    session.llave = llave;
    return 'ok';
  }

  take(
    token: string,
    walletAddress: string
  ): { status: 'pending' } | { status: 'ready'; llave: string } | { status: 'gone' } {
    const session = this.sessions.get(token);
    if (!session || session.expiresAt <= Date.now()) {
      if (session) this.sessions.delete(token);
      return { status: 'gone' };
    }
    // Foreign wallet: reveal nothing, change nothing.
    if (session.walletAddress !== walletAddress) return { status: 'gone' };
    if (session.llave === null) return { status: 'pending' };
    // Single delivery: consume on read.
    this.sessions.delete(token);
    return { status: 'ready', llave: session.llave };
  }
}

export const scanSessionService = new ScanSessionService();
