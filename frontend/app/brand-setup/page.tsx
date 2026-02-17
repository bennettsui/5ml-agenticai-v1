'use client';

import { useState, useCallback } from 'react';
import {
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Download,
  Save,
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

type WizardStep = 'brand-basics' | 'strategy' | 'scope' | 'team' | 'review';

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
};

export default function BrandSetupPage() {
  const [currentStep, setCurrentStep] = useState<WizardStep>('brand-basics');
  const [formState, setFormState] = useState<FormState>(INITIAL_FORM_STATE);
  const [strategy, setStrategy] = useState<GeneratedBrandStrategy | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

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
            profile: strategy.brandProfile,
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
        // Redirect or show success message
        window.location.href = `/dashboard?tab=control&brand=${strategy.brandProfile.brandName}`;
      }, 1500);
    } catch (error) {
      console.error('Error saving brand:', error);
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
    'review',
  ];
  const stepIndex = steps.indexOf(currentStep);
  const progress = ((stepIndex + 1) / steps.length) * 100;

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
                <h1 className="text-2xl font-bold">Brand Onboarding</h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Social Media Operations Platform Setup
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
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-green-600 hover:bg-green-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-medium"
                  >
                    {isSaving ? (
                      <>
                        <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save Brand
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Status messages */}
              {saveStatus === 'success' && (
                <div className="mt-4 flex items-center gap-2 px-4 py-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  Brand saved successfully! Redirecting...
                </div>
              )}
              {saveStatus === 'error' && (
                <div className="mt-4 flex items-center gap-2 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  Error saving brand. Please try again.
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
