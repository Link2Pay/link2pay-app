//
// DiditKycProvider — real merchant-KYC provider (production scaffold).
//
// Didit offers a genuinely free KYC tier with a hosted verification flow plus
// both status polling and signed webhooks. Polling (getStatus) is the primary
// mechanism here so the gate works on localhost without a public callback URL.
//
// Like AbroadAdapter, the request/response field mappings below follow Didit's
// documented REST shape and MUST be confirmed against the live docs
// (https://docs.didit.me) once an API key is issued.
//
//   Auth header:  x-api-key: <DIDIT_API_KEY>
//   Webhook:      HMAC-SHA256(rawBody, DIDIT_WEBHOOK_SECRET) in x-signature
//
// Activation: set KYC_PROVIDER=didit + DIDIT_API_KEY (+ DIDIT_WEBHOOK_SECRET
// to accept webhooks). DIDIT_API_BASE overrides the default endpoint.
//

import crypto from 'crypto';
import { config } from '../../config';
import { log } from '../../utils/logger';
import {
  KycProvider,
  StartVerificationParams,
  StartVerificationResult,
  KycVerificationStatus,
} from '../KycProvider';

interface DiditSessionResponse {
  session_id?: string;
  url?: string;
}

interface DiditDecisionResponse {
  status?: string;
}

/** Map Didit's decision strings onto our 3-state model. */
function mapStatus(raw: string | undefined): KycVerificationStatus {
  switch ((raw ?? '').toLowerCase()) {
    case 'approved':
      return 'VERIFIED';
    case 'declined':
    case 'expired':
    case 'abandoned':
      return 'REJECTED';
    default:
      // 'not started', 'in progress', 'in review', …
      return 'PENDING';
  }
}

export class DiditKycProvider implements KycProvider {
  readonly id = 'didit' as const;

  private baseUrl(): string {
    if (!config.kyc.didit.apiKey) {
      throw new Error(
        'DIDIT_NOT_CONFIGURED: set DIDIT_API_KEY to use KYC_PROVIDER=didit'
      );
    }
    return config.kyc.didit.apiBase.replace(/\/$/, '');
  }

  private async call<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${this.baseUrl()}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.kyc.didit.apiKey as string,
        ...(init?.headers ?? {}),
      },
    });
    if (!res.ok) {
      const body = await res.text();
      log.error('[DiditKycProvider] API error', {
        path,
        status: res.status,
        body: body.slice(0, 300),
      });
      throw new Error(`DIDIT_API_ERROR ${res.status}`);
    }
    return (await res.json()) as T;
  }

  async startVerification(
    params: StartVerificationParams
  ): Promise<StartVerificationResult> {
    // Field names per Didit's session API — confirm against live docs.
    const data = await this.call<DiditSessionResponse>('/v1/session/', {
      method: 'POST',
      body: JSON.stringify({
        vendor_data: params.walletAddress,
        callback: params.returnUrl,
        contact_details: {
          email: params.profile.email ?? undefined,
          phone: params.profile.phone ?? undefined,
        },
      }),
    });
    const ref = data.session_id;
    const verificationUrl = data.url;
    if (!ref) throw new Error('DIDIT_SESSION_MISSING_ID');
    if (!verificationUrl) throw new Error('DIDIT_SESSION_MISSING_URL');
    return { ref, verificationUrl };
  }

  async getStatus(ref: string): Promise<KycVerificationStatus> {
    const data = await this.call<DiditDecisionResponse>(
      `/v1/session/${encodeURIComponent(ref)}/decision/`
    );
    return mapStatus(data.status);
  }

  parseWebhook(
    rawBody: string,
    headers: Record<string, string | string[] | undefined>
  ): { ref: string; status: KycVerificationStatus } | null {
    const secret = config.kyc.didit.webhookSecret;
    if (!secret) {
      log.warn('[DiditKycProvider] webhook received but DIDIT_WEBHOOK_SECRET unset');
      return null;
    }
    const sigHeader = headers['x-signature'];
    const signature = Array.isArray(sigHeader) ? sigHeader[0] : sigHeader;
    if (!signature) return null;

    const expected = crypto
      .createHmac('sha256', secret)
      .update(rawBody, 'utf8')
      .digest('hex');
    // Constant-time compare; bail if lengths differ (timingSafeEqual throws).
    const a = Buffer.from(signature, 'utf8');
    const b = Buffer.from(expected, 'utf8');
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      log.warn('[DiditKycProvider] webhook signature mismatch');
      return null;
    }

    try {
      const payload = JSON.parse(rawBody) as {
        session_id?: string;
        status?: string;
      };
      if (!payload.session_id) return null;
      return { ref: payload.session_id, status: mapStatus(payload.status) };
    } catch {
      return null;
    }
  }
}

export const diditKycProvider = new DiditKycProvider();
