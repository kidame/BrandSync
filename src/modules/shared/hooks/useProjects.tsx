import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Project {
  id: string;
  name: string;
  region: string;
  country: string;
  description: string | null;
  status: "active" | "inactive" | "pending";
  created_at: string;
  updated_at: string;
}

interface ProjectsContextType {
  projects: Project[];
  selectedProject: Project | null;
  setSelectedProject: (project: Project | null) => void;
  loading: boolean;
  refresh: () => Promise<void>;
}

const ProjectsContext = createContext<ProjectsContextType | undefined>(undefined);

export function ProjectsProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProjects = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("territories")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      const typedProjects = data.map(p => ({
        ...p,
        status: p.status as "active" | "inactive" | "pending"
      }));
      setProjects(typedProjects);
      
      // Auto-select first active project if none selected
      if (!selectedProject) {
        const activeProject = typedProjects.find(p => p.status === "active");
        if (activeProject) {
          setSelectedProject(activeProject);
        }
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    loadProjects();
  }, []);

  return (
    <ProjectsContext.Provider
      value={{
        projects,
        selectedProject,
        setSelectedProject,
        loading,
        refresh: loadProjects,
      }}
    >
      {children}
    </ProjectsContext.Provider>
  );
}

export function useProjects() {
  const context = useContext(ProjectsContext);
  if (!context) {
    throw new Error("useProjects must be used within a ProjectsProvider");
  }
  return context;
}
