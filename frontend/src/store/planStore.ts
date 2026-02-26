import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { config } from '../config';
import { normalizePlanTier, type PlanTier } from '../lib/plans';

interface PlanState {
  tier: PlanTier;
  setTier: (tier: PlanTier) => void;
}

const initialTier = normalizePlanTier(config.planTier);

export const usePlanStore = create<PlanState>()(
  persist(
    (set) => ({
      tier: initialTier,
      setTier: (tier) => set({ tier }),
    }),
    {
      name: 'link2pay-plan-storage',
    }
  )
);
