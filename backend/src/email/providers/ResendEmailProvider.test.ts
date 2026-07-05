import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ResendEmailProvider } from './ResendEmailProvider';

describe('ResendEmailProvider', () => {
  const realFetch = global.fetch;
  afterEach(() => { global.fetch = realFetch; });

  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: 'email_123' }), { status: 200 })
    ) as unknown as typeof fetch;
  });

  it('POSTs the Resend payload with base64 attachments', async () => {
    const provider = new ResendEmailProvider('re_test_key', 'Link2Pay <invoices@link2pay.xyz>');
    await provider.send({
      to: 'merchant@example.com',
      subject: 'Invoice paid',
      html: '<p>hi</p>',
      attachments: [{ filename: 'invoice.pdf', content: Buffer.from('PDFDATA') }],
    });

    const [url, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe('https://api.resend.com/emails');
    expect(init.headers.Authorization).toBe('Bearer re_test_key');
    const body = JSON.parse(init.body);
    expect(body.from).toBe('Link2Pay <invoices@link2pay.xyz>');
    expect(body.to).toEqual(['merchant@example.com']);
    expect(body.attachments[0]).toEqual({
      filename: 'invoice.pdf',
      content: Buffer.from('PDFDATA').toString('base64'),
    });
  });

  it('throws on non-2xx with the response body in the message', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response('{"message":"invalid from"}', { status: 422 })
    ) as unknown as typeof fetch;
    const provider = new ResendEmailProvider('re_test_key', 'bad');
    await expect(
      provider.send({ to: 'a@b.c', subject: 's', html: '<p/>' })
    ).rejects.toThrow(/422/);
  });
});
