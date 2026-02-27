import 'express';

declare global {
  namespace Express {
    interface Request {
      walletAddress?: string;
      authVerified?: boolean;
    }
  }
}

export {};
