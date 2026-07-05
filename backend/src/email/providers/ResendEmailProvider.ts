import { EmailProvider, SendEmailInput } from '../types';

export class ResendEmailProvider implements EmailProvider {
  readonly id = 'resend';

  constructor(
    private readonly apiKey: string,
    private readonly from: string
  ) {}

  async send(input: SendEmailInput): Promise<void> {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: this.from,
        to: [input.to],
        subject: input.subject,
        html: input.html,
        ...(input.attachments?.length && {
          attachments: input.attachments.map((a) => ({
            filename: a.filename,
            content: a.content.toString('base64'),
          })),
        }),
      }),
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Resend send failed: ${res.status} ${body.slice(0, 300)}`);
    }
  }
}
