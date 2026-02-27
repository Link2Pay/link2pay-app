import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface DashboardViewState {
  showPreviewLinks: boolean;
  setShowPreviewLinks: (show: boolean) => void;
  toggleShowPreviewLinks: () => void;
}

export const useDashboardViewStore = create<DashboardViewState>()(
  persist(
    (set, get) => ({
      showPreviewLinks: false,
      setShowPreviewLinks: (showPreviewLinks: boolean) => set({ showPreviewLinks }),
      toggleShowPreviewLinks: () =>
        set({ showPreviewLinks: !get().showPreviewLinks }),
    }),
    {
      name: 'link2pay-dashboard-view',
      partialize: (state) => ({
        showPreviewLinks: state.showPreviewLinks,
      }),
    }
  )
);

