import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface DashboardViewState {
  showPreviewLinks: boolean;
}

export const useDashboardViewStore = create<DashboardViewState>()(
  persist(
    (): DashboardViewState => ({
      showPreviewLinks: false,
    }),
    {
      name: 'link2pay-dashboard-view',
      partialize: (state) => ({
        showPreviewLinks: state.showPreviewLinks,
      }),
    }
  )
);

