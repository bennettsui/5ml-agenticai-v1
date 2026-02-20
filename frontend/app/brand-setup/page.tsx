'use client';

import { useState, useCallback, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Download,
  Save,
  Loader2,
} from 'lucide-react';
import {
  INDUSTRY_TEMPLATES,
  GOAL_PILLAR_TEMPLATES,
  type Industry,
  type BusinessGoal,
} from '@/lib/brand-setup-config';
import {
  generateCompleteStrategy,
  type BrandFormData,
  type GeneratedBrandStrategy,
} from '@/lib/brand-strategy-generator';
import BrandSetupWizard from '@/components/BrandSetupWizard';
import StrategyPreview from '@/components/StrategyPreview';

type WizardStep = 'brand-basics' | 'strategy' | 'scope' | 'team' | 'identity' | 'review';

interface FormState extends Partial<BrandFormData> {
  brandName: string;
  industry?: Industry;
  markets: string[];
  languages: string[];
  primaryChannels: string[];
  businessGoal?: BusinessGoal;
  secondaryGoals: BusinessGoal[];
  postsPerWeek: number;
  monthlyBudgetHKD: number;
  approvalCycleDays: number;
  teamLiaison: string;
  // Brand Identity
  voiceTone?: string;
  brandPersonality?: string[];
  colorPalette?: {
    primary: string;
    secondary: string;
    accent: string;
  };
  visualStyle?: string;
}

const INITIAL_FORM_STATE: FormState = {
  brandName: '',
  industry: undefined,
  markets: [],
  languages: [],
  primaryChannels: [],
  businessGoal: undefined,
  secondaryGoals: [],
  postsPerWeek: 4,
  monthlyBudgetHKD: 25000,
  approvalCycleDays: 1,
  teamLiaison: '',
  voiceTone: undefined,
  brandPersonality: [],
  colorPalette: { primary: '#000000', secondary: '#666666', accent: '#0066ff' },
  visualStyle: undefined,
};

function BrandSetupPageContent() {
  const searchParams = useSearchParams();
  const editBrandName = searchParams.get('edit');

  const [currentStep, setCurrentStep] = useState<WizardStep>('brand-basics');
  const [formState, setFormState] = useState<FormState>(INITIAL_FORM_STATE);
  const [strategy, setStrategy] = useState<GeneratedBrandStrategy | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(!!editBrandName);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [isEditMode, setIsEditMode] = useState(!!editBrandName);

  // Load existing brand data if in edit mode
  useEffect(() => {
    if (!editBrandName) return;

    const fetchBrand = async () => {
      try {
        const response = await fetch(`/api/brands/${encodeURIComponent(editBrandName)}`);
        if (!response.ok) throw new Error('Brand not found');

        const data = await response.json();
        const brand = data.brand;

        if (brand?.brand_info?.profile) {
          const profile = brand.brand_info.profile;
          setFormState({
            brandName: profile.brandName,
            industry: profile.industry,
            markets: profile.markets || [],
            languages: profile.languages || [],
            primaryChannels: profile.primaryChannels || [],
            businessGoal: profile.businessGoal,
            secondaryGoals: profile.secondaryGoals || [],
            postsPerWeek: profile.postsPerWeek || 4,
            monthlyBudgetHKD: profile.monthlyBudgetHKD || 25000,
            approvalCycleDays: profile.approvalCycleDays || 1,
            teamLiaison: profile.teamLiaison || '',
            assetProvider: profile.assetProvider,
            approvalAuthority: profile.approvalAuthority,
          });

          // Regenerate strategy with loaded data
          const fullData: BrandFormData = {
            brandName: profile.brandName,
            industry: profile.industry,
            markets: profile.markets || [],
            languages: profile.languages || [],
            primaryChannels: profile.primaryChannels || [],
            businessGoal: profile.businessGoal,
            secondaryGoals: profile.secondaryGoals || [],
            postsPerWeek: profile.postsPerWeek || 4,
            monthlyBudgetHKD: profile.monthlyBudgetHKD || 25000,
            approvalCycleDays: profile.approvalCycleDays || 1,
            teamLiaison: profile.teamLiaison || '',
            assetProvider: profile.assetProvider,
            approvalAuthority: profile.approvalAuthority,
          };
          const generated = generateCompleteStrategy(fullData);
          setStrategy(generated);
        }
      } catch (error) {
        console.error('Error loading brand:', error);
        setSaveStatus('error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBrand();
  }, [editBrandName]);

  // Update form state
  const updateForm = useCallback((updates: Partial<FormState>) => {
    setFormState((prev) => {
      const updated = { ...prev, ...updates };
      // Regenerate strategy on form changes
      if (
        updated.brandName &&
        updated.industry &&
        updated.businessGoal &&
        updated.primaryChannels.length > 0
      ) {
        const fullData: BrandFormData = {
          brandName: updated.brandName,
          industry: updated.industry,
          markets: updated.markets,
          languages: updated.languages,
          primaryChannels: updated.primaryChannels,
          businessGoal: updated.businessGoal,
          secondaryGoals: updated.secondaryGoals,
          postsPerWeek: updated.postsPerWeek,
          monthlyBudgetHKD: updated.monthlyBudgetHKD,
          approvalCycleDays: updated.approvalCycleDays,
          teamLiaison: updated.teamLiaison,
        };
        const generated = generateCompleteStrategy(fullData);
        setStrategy(generated);
      }
      return updated;
    });
  }, []);

  // Check step completion
  const isStepComplete = useCallback(
    (step: WizardStep): boolean => {
      switch (step) {
        case 'brand-basics':
          return !!formState.brandName && !!formState.industry;
        case 'strategy':
          return !!formState.businessGoal && formState.primaryChannels.length > 0;
        case 'scope':
          return formState.postsPerWeek > 0 && formState.monthlyBudgetHKD > 0;
        case 'team':
          return !!formState.teamLiaison;
        case 'identity':
          return true; // Optional step - always allowed to skip
        case 'review':
          return !!strategy;
        default:
          return false;
      }
    },
    [formState, strategy]
  );

  // Navigate to next step
  const goToNextStep = useCallback(() => {
    const steps: WizardStep[] = [
      'brand-basics',
      'strategy',
      'scope',
      'team',
      'identity',
      'review',
    ];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1 && isStepComplete(currentStep)) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  }, [currentStep, isStepComplete]);

  // Navigate to previous step
  const goToPrevStep = useCallback(() => {
    const steps: WizardStep[] = [
      'brand-basics',
      'strategy',
      'scope',
      'team',
      'identity',
      'review',
    ];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  }, [currentStep]);

  // Save brand to backend
  const handleSave = async () => {
    if (!strategy) return;

    setIsSaving(true);
    setSaveStatus('idle');

    try {
      const response = await fetch('/api/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand_name: strategy.brandProfile.brandName,
          industry: strategy.brandProfile.industry,
          brand_info: {
            profile: {
              ...strategy.brandProfile,
              voiceTone: formState.voiceTone,
              brandPersonality: formState.brandPersonality,
              colorPalette: formState.colorPalette,
              visualStyle: formState.visualStyle,
            },
            pillars: strategy.contentPillars,
            calendar: strategy.monthlyCalendarTemplate,
            kpis: strategy.kpiTargets,
            summary: strategy.summary,
          },
        }),
      });

      if (!response.ok) throw new Error('Failed to save brand');

      setSaveStatus('success');
      setTimeout(() => {
        // Redirect to brands management
        window.location.href = `/brands?updated=${strategy.brandProfile.brandName}`;
      }, 1500);
    } catch (error) {
      console.error('Error saving brand:', error);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  // Save to CRM - auto-creates brand in CRM system
  const handleSaveToCRM = async () => {
    if (!strategy) return;

    setIsSaving(true);
    setSaveStatus('idle');

    try {
      const response = await fetch('/api/brands/setup-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandName: strategy.brandProfile.brandName,
          industry: strategy.brandProfile.industry,
          markets: formState.markets,
          languages: formState.languages,
          primaryChannels: formState.primaryChannels,
          postsPerWeek: formState.postsPerWeek,
          monthlyBudgetHKD: formState.monthlyBudgetHKD,
          approvalCycleDays: formState.approvalCycleDays,
          teamLiaison: formState.teamLiaison,
          assetProvider: formState.assetProvider,
          approvalAuthority: formState.approvalAuthority,
          voiceTone: formState.voiceTone,
          brandPersonality: formState.brandPersonality,
          colorPalette: formState.colorPalette,
          visualStyle: formState.visualStyle,
          strategy: strategy,
        }),
      });

      if (!response.ok) throw new Error('Failed to save brand to CRM');

      const data = await response.json();
      setSaveStatus('success');
      setTimeout(() => {
        // Redirect to CRM brand detail
        window.location.href = data.redirect || `/use-cases/crm/brands/detail?id=${data.brand_id}`;
      }, 1500);
    } catch (error) {
      console.error('Error saving brand to CRM:', error);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const steps: WizardStep[] = [
    'brand-basics',
    'strategy',
    'scope',
    'team',
    'identity',
    'review',
  ];
  const stepIndex = steps.indexOf(currentStep);
  const progress = ((stepIndex + 1) / steps.length) * 100;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-slate-600 mx-auto mb-3 animate-spin" />
          <p className="text-slate-400">Loading brand strategy...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="sticky top-0 z-50 border-b border-slate-700/50 bg-slate-900/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Sparkles className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">
                  {isEditMode ? 'Edit Brand' : 'Brand Onboarding'}
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isEditMode
                    ? `Updating: ${formState.brandName}`
                    : 'Social Media Operations Platform Setup'}
                </p>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-800/50 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Wizard Form */}
          <div className="lg:col-span-2">
            <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-8">
              <BrandSetupWizard
                currentStep={currentStep}
                formState={formState}
                onUpdate={updateForm}
                onNext={goToNextStep}
                onPrev={goToPrevStep}
                isStepComplete={isStepComplete}
              />

              {/* Navigation buttons */}
              <div className="flex gap-3 justify-between mt-8 pt-6 border-t border-slate-700/30">
                <button
                  onClick={goToPrevStep}
                  disabled={stepIndex === 0}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-700/50 bg-slate-800/40 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>

                <div className="text-xs text-slate-500">
                  Step {stepIndex + 1} of {steps.length}
                </div>

                {currentStep !== 'review' ? (
                  <button
                    onClick={goToNextStep}
                    disabled={!isStepComplete(currentStep)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-medium"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-medium"
                    >
                      {isSaving ? (
                        <>
                          <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          Download Strategy
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleSaveToCRM()}
                      disabled={isSaving}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-medium text-white"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Saving to CRM...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Save to CRM
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Status messages */}
              {saveStatus === 'success' && (
                <div className="mt-4 flex items-center gap-2 px-4 py-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  {isEditMode ? 'Brand updated' : 'Brand created'} successfully! Redirecting...
                </div>
              )}
              {saveStatus === 'error' && (
                <div className="mt-4 flex items-center gap-2 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  Error {isEditMode ? 'updating' : 'saving'} brand. Please try again.
                </div>
              )}
            </div>
          </div>

          {/* Right: Strategy Preview */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              {strategy ? (
                <StrategyPreview strategy={strategy} />
              ) : (
                <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-6 text-center">
                  <Sparkles className="w-12 h-12 text-slate-700 mx-auto mb-3 opacity-50" />
                  <p className="text-sm text-slate-400">
                    Fill out the form to see your generated strategy preview here
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BrandSetupPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BrandSetupPageContent />
    </Suspense>
  );
}
