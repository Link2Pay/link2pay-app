import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type LinkedWallet = {
  walletAddress: string;
  provider: 'FREIGHTER';
  providerEmail: string | null;
  isPrimary: boolean;
};

export type AuthUser = {
  id: string;
  email: string | null;
  displayName: string | null;
  wallets: LinkedWallet[];
};

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  activeWallet: string | null;
  setSession: (payload: { token: string; user: AuthUser; activeWallet: string | null }) => void;
  clearSession: () => void;
  setActiveWallet: (walletAddress: string | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      activeWallet: null,
      setSession: ({ token, user, activeWallet }) => {
        set({ token, user, activeWallet });
      },
      clearSession: () => {
        set({ token: null, user: null, activeWallet: null });
      },
      setActiveWallet: (walletAddress) => {
        set({ activeWallet: walletAddress });
      },
    }),
    {
      name: 'link2pay-auth-storage',
    }
  )
);
