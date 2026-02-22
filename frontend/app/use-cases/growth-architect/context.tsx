'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

interface GrowthPlan {
  id: string;
  brand_name: string;
  plan_data: any;
  status: string;
  phase: string;
  created_at: string;
  updated_at: string;
}

interface BrandConfig {
  name: string;
  brief: string;
  icp: string;
  plan?: GrowthPlan;
}

interface GrowthArchitectContextType {
  selectedBrand: string;
  setSelectedBrand: (brand: string) => void;
  currentPlan: GrowthPlan | null;
  setCurrentPlan: (plan: GrowthPlan | null) => void;
  brands: BrandConfig[];
  setBrands: (brands: BrandConfig[]) => void;
  isLoadingPlan: boolean;
  setIsLoadingPlan: (loading: boolean) => void;
  chatbotOpen: boolean;
  setChatbotOpen: (open: boolean) => void;
}

const GrowthArchitectContext = createContext<GrowthArchitectContextType | undefined>(undefined);

export function GrowthArchitectProvider({ children }: { children: React.ReactNode }) {
  const [selectedBrand, setSelectedBrand] = useState('ikigai Design & Research');
  const [currentPlan, setCurrentPlan] = useState<GrowthPlan | null>(null);
  const [isLoadingPlan, setIsLoadingPlan] = useState(false);
  const [chatbotOpen, setChatbotOpen] = useState(true);
  const [brands, setBrands] = useState<BrandConfig[]>([
    {
      name: 'ikigai Design & Research',
      brief: 'Comprehensive elderly home assessments service. We conduct detailed in-home evaluations assessing safety, accessibility, mobility, cognitive function, and care needs of seniors. Reports provide actionable recommendations for home modifications, care planning, and family discussions about elder care.',
      icp: 'Families of elderly parents (45-65 yo, Hong Kong), healthcare social workers, elder care coordinators',
    },
    {
      name: '5ML Agentic Solution',
      brief: '5ML is a creative + technical growth studio building productized agentic AI systems for growth. End-to-end solutions: agent orchestration, multi-LLM routing, RAG knowledge bases, paid media integration, content generation, CRM automation, and agentic workflow design.',
      icp: 'SaaS founders, marketing agency owners, enterprise growth leads (Hong Kong / SEA / global)',
    },
  ]);

  return (
    <GrowthArchitectContext.Provider
      value={{
        selectedBrand,
        setSelectedBrand,
        currentPlan,
        setCurrentPlan,
        brands,
        setBrands,
        isLoadingPlan,
        setIsLoadingPlan,
        chatbotOpen,
        setChatbotOpen,
      }}
    >
      {children}
    </GrowthArchitectContext.Provider>
  );
}

export function useGrowthArchitect() {
  const context = useContext(GrowthArchitectContext);
  if (!context) {
    throw new Error('useGrowthArchitect must be used within GrowthArchitectProvider');
  }
  return context;
}
