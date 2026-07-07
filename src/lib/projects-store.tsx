"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { sbFetchProjects } from "@/lib/supabase";
import { PROJECTS_DEFAULT } from "@/data/projects";
import type { Project } from "@/lib/types";

// Source of truth: Supabase `projects`; falls back to the static catalogue when
// Supabase is unset or returns nothing (mirrors the original loadProjects()).
export async function loadProjects(): Promise<Project[]> {
  try {
    const list = await sbFetchProjects();
    return list.length
      ? list
      : (JSON.parse(JSON.stringify(PROJECTS_DEFAULT)) as Project[]);
  } catch (e) {
    console.error("loadProjects fell back to defaults:", e);
    return JSON.parse(JSON.stringify(PROJECTS_DEFAULT)) as Project[];
  }
}

interface ProjectsContextValue {
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  reload: () => Promise<void>;
}

const ProjectsContext = createContext<ProjectsContextValue | null>(null);

export function ProjectsProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);

  const reload = useCallback(async () => {
    setProjects(await loadProjects());
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return (
    <ProjectsContext.Provider value={{ projects, setProjects, reload }}>
      {children}
    </ProjectsContext.Provider>
  );
}

export function useProjects(): ProjectsContextValue {
  const ctx = useContext(ProjectsContext);
  if (!ctx) throw new Error("useProjects must be used within <ProjectsProvider>");
  return ctx;
}
