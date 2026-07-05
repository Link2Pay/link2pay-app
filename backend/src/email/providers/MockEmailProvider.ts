import { EmailProvider, SendEmailInput } from '../types';
import { log } from '../../utils/logger';

export class MockEmailProvider implements EmailProvider {
  readonly id = 'mock';

  async send(input: SendEmailInput): Promise<void> {
    log.info('[email:mock] send', {
      to: input.to,
      subject: input.subject,
      attachments: input.attachments?.map((a) => `${a.filename} (${a.content.length}b)`) ?? [],
    });
  }
}
