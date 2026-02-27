import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, FolderKanban, Lock, Plus } from 'lucide-react';
import PlanLockModal from './PlanLockModal';
import { usePlanStore } from '../store/planStore';
import { useProjectStore } from '../store/projectStore';
import { tierAtLeast } from '../lib/plans';

const PRO_PROJECT_LIMIT = 5;

export default function ProjectSelector() {
  const tier = usePlanStore((state) => state.tier);
  const projects = useProjectStore((state) => state.projects);
  const activeProjectId = useProjectStore((state) => state.activeProjectId);
  const setActiveProject = useProjectStore((state) => state.setActiveProject);
  const addProject = useProjectStore((state) => state.addProject);

  const [open, setOpen] = useState(false);
  const [showProLock, setShowProLock] = useState(false);
  const [showBusinessLock, setShowBusinessLock] = useState(false);

  const rootRef = useRef<HTMLDivElement | null>(null);

  const activeProject = useMemo(
    () => projects.find((project) => project.id === activeProjectId) || projects[0],
    [activeProjectId, projects]
  );

  const canCreateProjects = tierAtLeast(tier, 'pro');
  const reachedProLimit = tier === 'pro' && projects.length >= PRO_PROJECT_LIMIT;

  useEffect(() => {
    if (!open) return;

    const onMouseDown = (event: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [open]);

  const handleAddProject = () => {
    if (!canCreateProjects) {
      setOpen(false);
      setShowProLock(true);
      return;
    }

    if (reachedProLimit) {
      setOpen(false);
      setShowBusinessLock(true);
      return;
    }

    addProject(`Project ${projects.length + 1}`);
    setOpen(false);
  };

  return (
    <>
      <div ref={rootRef} className="relative">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="inline-flex items-center gap-2 rounded-xl border border-surface-3 bg-surface-1 px-3 py-1.5 text-left transition-colors hover:border-primary/35"
        >
          <FolderKanban className="h-4 w-4 text-primary" />
          <div className="hidden min-[520px]:block">
            <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Project</p>
            <p className="max-w-[130px] truncate text-xs font-semibold text-foreground">
              {activeProject?.name || 'Default'}
            </p>
          </div>
          <span className="min-[520px]:hidden text-xs font-semibold text-foreground">
            {activeProject?.name || 'Default'}
          </span>
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>

        {open && (
          <div className="absolute left-0 top-full z-30 mt-2 w-[260px] rounded-xl border border-surface-3 bg-surface-1 p-2 shadow-xl">
            <div className="mb-2 px-2 py-1">
              <p className="text-[11px] text-muted-foreground">Project scope for links, keys, and webhooks</p>
            </div>

            <div className="space-y-1">
              {projects.map((project) => {
                const selected = project.id === activeProjectId;
                return (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => {
                      setActiveProject(project.id);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-sm transition-colors ${
                      selected
                        ? 'bg-primary/10 text-primary'
                        : 'text-foreground hover:bg-sidebar-accent'
                    }`}
                  >
                    <span className="truncate">{project.name}</span>
                    {selected && <span className="text-[10px] uppercase tracking-wide">Active</span>}
                  </button>
                );
              })}
            </div>

            <div className="mt-2 border-t border-surface-3 pt-2">
              <button
                type="button"
                onClick={handleAddProject}
                className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-sm text-foreground transition-colors hover:bg-sidebar-accent"
              >
                <span className="inline-flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  New project
                </span>
                {!canCreateProjects && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-surface-3 px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                    <Lock className="h-3 w-3" />
                    Pro
                  </span>
                )}
                {reachedProLimit && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-surface-3 px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                    <Lock className="h-3 w-3" />
                    Business
                  </span>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      <PlanLockModal
        open={showProLock}
        requiredTier="pro"
        title="New projects are a Pro feature"
        description="Upgrade to Pro to create multiple projects and isolate API keys, webhooks, and link settings per environment."
        onClose={() => setShowProLock(false)}
      />

      <PlanLockModal
        open={showBusinessLock}
        requiredTier="business"
        title="Pro project limit reached"
        description="Upgrade to Business for unlimited projects and advanced per-project controls."
        onClose={() => setShowBusinessLock(false)}
      />
    </>
  );
}

