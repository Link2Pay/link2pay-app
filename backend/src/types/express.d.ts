import 'express';

declare global {
  namespace Express {
    interface Request {
      walletAddress?: string;
      /** Raw request bytes, captured for signed-webhook verification. */
      rawBody?: Buffer;
    }
  }
}

export {};
