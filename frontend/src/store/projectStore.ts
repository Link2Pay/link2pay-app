import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface DashboardProject {
  id: string;
  name: string;
}

interface ProjectState {
  projects: DashboardProject[];
  activeProjectId: string;
  setActiveProject: (projectId: string) => void;
  addProject: (name: string) => void;
}

const DEFAULT_PROJECT: DashboardProject = {
  id: 'default',
  name: 'Default',
};

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      projects: [DEFAULT_PROJECT],
      activeProjectId: DEFAULT_PROJECT.id,
      setActiveProject: (projectId) => {
        const exists = get().projects.some((project) => project.id === projectId);
        if (!exists) return;
        set({ activeProjectId: projectId });
      },
      addProject: (name) => {
        const projectName = name.trim();
        if (!projectName) return;

        const id = `project-${Date.now()}`;
        set((state) => ({
          projects: [...state.projects, { id, name: projectName }],
          activeProjectId: id,
        }));
      },
    }),
    {
      name: 'link2pay-project-storage',
    }
  )
);

