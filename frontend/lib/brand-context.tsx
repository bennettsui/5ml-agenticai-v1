'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { crmApi, type Brand, type Project } from './crm-kb-api';

interface BrandContextValue {
  brands: Brand[];
  selectedBrand: Brand | null;
  selectBrand: (brand: Brand | null) => void;
  projects: Project[];
  selectedProject: Project | null;
  selectProject: (project: Project | null) => void;
  loading: boolean;
  refreshBrands: () => Promise<void>;
  refreshProjects: () => Promise<void>;
}

const BrandContext = createContext<BrandContextValue | null>(null);

const STORAGE_KEY = '5ml-selected-brand-project';

export function BrandProvider({ children }: { children: ReactNode }) {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshBrands = useCallback(async () => {
    try {
      const res = await crmApi.brands.list({ size: 100 });
      setBrands(res.items);
    } catch { /* silent */ }
  }, []);

  const refreshProjects = useCallback(async () => {
    if (!selectedBrand) { setProjects([]); return; }
    try {
      const res = await crmApi.brands.projects(selectedBrand.id);
      setProjects(res.items);
    } catch { /* silent */ }
  }, [selectedBrand]);

  // Load projects when brand changes
  useEffect(() => { refreshProjects(); }, [refreshProjects]);

  // Init: load brands + restore selection
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const res = await crmApi.brands.list({ size: 100 });
        setBrands(res.items);
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const { brandId, projectId } = JSON.parse(saved);
          if (brandId) {
            const found = res.items.find((b: Brand) => b.id === brandId);
            if (found) setSelectedBrand(found);
          }
          if (projectId) {
            // project will be loaded after brand effect triggers refreshProjects
            setSelectedProject({ id: projectId } as Project);
          }
        }
      } catch { /* silent */ }
      setLoading(false);
    };
    init();
  }, []);

  // Resolve project object after projects load
  useEffect(() => {
    if (selectedProject && projects.length > 0 && !selectedProject.name) {
      const found = projects.find(p => p.id === selectedProject.id);
      if (found) setSelectedProject(found);
      else setSelectedProject(null);
    }
  }, [projects, selectedProject]);

  const selectBrand = useCallback((brand: Brand | null) => {
    setSelectedBrand(brand);
    setSelectedProject(null);
    setProjects([]);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ brandId: brand?.id || null, projectId: null }));
  }, []);

  const selectProject = useCallback((project: Project | null) => {
    setSelectedProject(project);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      brandId: selectedBrand?.id || null,
      projectId: project?.id || null,
    }));
  }, [selectedBrand]);

  return (
    <BrandContext.Provider value={{
      brands, selectedBrand, selectBrand,
      projects, selectedProject, selectProject,
      loading, refreshBrands, refreshProjects,
    }}>
      {children}
    </BrandContext.Provider>
  );
}

export function useBrandProject() {
  const ctx = useContext(BrandContext);
  if (!ctx) throw new Error('useBrandProject must be used within BrandProvider');
  return ctx;
}
