import prisma from '../db';
import { log } from '../utils/logger';

export interface WaitlistInput {
  email: string;
  rail: string;
  country?: string;
  wallet?: string;
}

export class WaitlistService {
  /**
   * Record interest in a not-yet-live fiat rail (Pix / Transferência 3.0) so
   * we can notify the merchant when it opens. Intentionally append-only —
   * duplicates are fine; we care about demand signal, not uniqueness.
   */
  async add(input: WaitlistInput) {
    const entry = await prisma.waitlistEntry.create({
      data: {
        email: input.email.trim().toLowerCase(),
        rail: input.rail,
        country: input.country?.trim() || null,
        wallet: input.wallet?.trim() || null,
      },
    });
    log.info('[Waitlist] captured interest', { rail: entry.rail, country: entry.country });
    return entry;
  }
}

export const waitlistService = new WaitlistService();
