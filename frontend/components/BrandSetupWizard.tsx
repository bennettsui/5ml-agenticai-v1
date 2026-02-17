import { useState } from 'react';
import {
  INDUSTRY_TEMPLATES,
  GOAL_PILLAR_TEMPLATES,
  type Industry,
  type BusinessGoal,
} from '@/lib/brand-setup-config';
import { ChevronDown } from 'lucide-react';

interface BrandSetupWizardProps {
  currentStep: string;
  formState: any;
  onUpdate: (updates: any) => void;
  onNext: () => void;
  onPrev: () => void;
  isStepComplete: (step: string) => boolean;
}

const CHANNELS = ['Instagram', 'Facebook', 'TikTok', 'LinkedIn', 'YouTube', 'Pinterest'];
const LANGUAGES = ['English', 'Traditional Chinese', 'Simplified Chinese', 'Cantonese'];
const MARKETS = ['Hong Kong', 'Singapore', 'Taiwan', 'Macau', 'mainland China', 'Australia', 'New Zealand'];
const BUSINESS_GOALS = [
  { id: 'growth' as BusinessGoal, name: 'Market Share Growth', desc: 'Expand customer base & market presence' },
  { id: 'retention' as BusinessGoal, name: 'Customer Retention', desc: 'Deepen engagement with existing customers' },
  { id: 'launch' as BusinessGoal, name: 'Product Launch', desc: 'Introduce new offering to market' },
  { id: 'authority' as BusinessGoal, name: 'Thought Leadership', desc: 'Establish expertise in industry' },
  { id: 'community' as BusinessGoal, name: 'Community Building', desc: 'Grow engaged, vocal fan base' },
  { id: 'crisis' as BusinessGoal, name: 'Crisis Management', desc: 'Rebuild trust and reputation' },
  { id: 'seasonal' as BusinessGoal, name: 'Seasonal Sales Push', desc: 'Capitalize on seasonal demand' },
  { id: 'positioning' as BusinessGoal, name: 'Brand Repositioning', desc: 'Change market perception' },
];

export default function BrandSetupWizard({
  currentStep,
  formState,
  onUpdate,
  onNext,
  onPrev,
  isStepComplete,
}: BrandSetupWizardProps) {
  const [expandedIndustry, setExpandedIndustry] = useState(false);

  // Step 1: Brand Basics
  if (currentStep === 'brand-basics') {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold mb-2">Brand Basics</h2>
          <p className="text-sm text-slate-400 mb-6">
            Let's start with your brand name and industry
          </p>
        </div>

        {/* Brand Name */}
        <div>
          <label className="block text-sm font-medium mb-2">Brand Name</label>
          <input
            type="text"
            value={formState.brandName}
            onChange={(e) => onUpdate({ brandName: e.target.value })}
            placeholder="e.g., Daikin Hong Kong"
            className="w-full px-4 py-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
          />
        </div>

        {/* Industry Selection */}
        <div>
          <label className="block text-sm font-medium mb-3">Industry</label>
          <div className="grid grid-cols-1 gap-2">
            {(Object.values(INDUSTRY_TEMPLATES) as typeof INDUSTRY_TEMPLATES[Industry][]).map((ind) => (
              <button
                key={ind.id}
                onClick={() => onUpdate({ industry: ind.id })}
                className={`text-left px-4 py-3.5 rounded-lg border transition-all ${
                  formState.industry === ind.id
                    ? 'bg-purple-600/20 border-purple-500/50 ring-1 ring-purple-500/30'
                    : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/60'
                }`}
              >
                <div className="font-medium text-sm">{ind.name}</div>
                <div className="text-xs text-slate-400 mt-0.5">{ind.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Markets */}
        {formState.industry && (
          <div>
            <label className="block text-sm font-medium mb-2">Primary Markets</label>
            <div className="grid grid-cols-2 gap-2">
              {MARKETS.map((market) => (
                <label key={market} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formState.markets.includes(market)}
                    onChange={(e) => {
                      const newMarkets = e.target.checked
                        ? [...formState.markets, market]
                        : formState.markets.filter((m: string) => m !== market);
                      onUpdate({ markets: newMarkets });
                    }}
                    className="w-4 h-4 rounded bg-slate-800 border-slate-600 accent-purple-500 cursor-pointer"
                  />
                  <span className="text-sm text-slate-300">{market}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Step 2: Strategy
  if (currentStep === 'strategy') {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold mb-2">Business Strategy</h2>
          <p className="text-sm text-slate-400 mb-6">
            Define your primary business goal and channels
          </p>
        </div>

        {/* Primary Business Goal */}
        <div>
          <label className="block text-sm font-medium mb-3">Primary Business Goal</label>
          <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
            {BUSINESS_GOALS.map((goal) => (
              <button
                key={goal.id}
                onClick={() => onUpdate({ businessGoal: goal.id })}
                className={`text-left px-4 py-3 rounded-lg border transition-all ${
                  formState.businessGoal === goal.id
                    ? 'bg-purple-600/20 border-purple-500/50 ring-1 ring-purple-500/30'
                    : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/60'
                }`}
              >
                <div className="font-medium text-sm">{goal.name}</div>
                <div className="text-xs text-slate-400 mt-0.5">{goal.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Primary Channels */}
        <div>
          <label className="block text-sm font-medium mb-2">Primary Channels</label>
          <div className="grid grid-cols-2 gap-2">
            {CHANNELS.map((channel) => (
              <label key={channel} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formState.primaryChannels.includes(channel)}
                  onChange={(e) => {
                    const newChannels = e.target.checked
                      ? [...formState.primaryChannels, channel]
                      : formState.primaryChannels.filter((c: string) => c !== channel);
                    onUpdate({ primaryChannels: newChannels });
                  }}
                  className="w-4 h-4 rounded bg-slate-800 border-slate-600 accent-purple-500 cursor-pointer"
                />
                <span className="text-sm text-slate-300">{channel}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Languages */}
        <div>
          <label className="block text-sm font-medium mb-2">Content Languages</label>
          <div className="grid grid-cols-2 gap-2">
            {LANGUAGES.map((lang) => (
              <label key={lang} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formState.languages.includes(lang)}
                  onChange={(e) => {
                    const newLangs = e.target.checked
                      ? [...formState.languages, lang]
                      : formState.languages.filter((l: string) => l !== lang);
                    onUpdate({ languages: newLangs });
                  }}
                  className="w-4 h-4 rounded bg-slate-800 border-slate-600 accent-purple-500 cursor-pointer"
                />
                <span className="text-sm text-slate-300">{lang}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Step 3: Scope
  if (currentStep === 'scope') {
    const industryTemplate = formState.industry ? INDUSTRY_TEMPLATES[formState.industry as Industry] : null;

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold mb-2">Content Scope</h2>
          <p className="text-sm text-slate-400 mb-6">
            Define your posting cadence and budget
          </p>
        </div>

        {/* Posts Per Week */}
        <div>
          <label className="block text-sm font-medium mb-2">Posts Per Week</label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="1"
              max="15"
              value={formState.postsPerWeek}
              onChange={(e) => onUpdate({ postsPerWeek: parseInt(e.target.value) })}
              className="flex-1 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
            <div className="text-2xl font-bold text-purple-400 min-w-12 text-right">
              {formState.postsPerWeek}
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            {formState.postsPerWeek <= 3 ? 'Low frequency (thought leadership)' :
             formState.postsPerWeek <= 6 ? 'Moderate (balanced)' :
             'High frequency (growth-focused)'}
          </p>
        </div>

        {/* Monthly Budget */}
        <div>
          <label className="block text-sm font-medium mb-2">Monthly Budget (HK$)</label>
          <input
            type="number"
            value={formState.monthlyBudgetHKD}
            onChange={(e) => onUpdate({ monthlyBudgetHKD: parseInt(e.target.value) || 0 })}
            className="w-full px-4 py-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
          />
          {industryTemplate && (
            <p className="text-xs text-slate-500 mt-2">
              Typical range for {industryTemplate.name}: HK$
              {industryTemplate.typicalBudgetRange[0].toLocaleString()} –{' '}
              {industryTemplate.typicalBudgetRange[1].toLocaleString()}
            </p>
          )}
        </div>

        {/* Approval Cycle */}
        <div>
          <label className="block text-sm font-medium mb-2">Approval Cycle (Hours)</label>
          <select
            value={formState.approvalCycleDays * 24}
            onChange={(e) => onUpdate({ approvalCycleDays: parseInt(e.target.value) / 24 })}
            className="w-full px-4 py-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
          >
            <option value={4}>4 hours (fast-paced)</option>
            <option value={24}>24 hours (standard)</option>
            <option value={36}>36 hours (thorough review)</option>
            <option value={48}>48 hours (extended review)</option>
            <option value={72}>72 hours (detailed alignment)</option>
          </select>
        </div>
      </div>
    );
  }

  // Step 4: Team
  if (currentStep === 'team') {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold mb-2">Team & Workflow</h2>
          <p className="text-sm text-slate-400 mb-6">
            Define your team roles for smooth operations
          </p>
        </div>

        {/* Team Liaison */}
        <div>
          <label className="block text-sm font-medium mb-2">Client Liaison</label>
          <input
            type="text"
            value={formState.teamLiaison}
            onChange={(e) => onUpdate({ teamLiaison: e.target.value })}
            placeholder="Name and contact info"
            className="w-full px-4 py-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
          />
        </div>

        {/* Asset Provider */}
        <div>
          <label className="block text-sm font-medium mb-2">Asset Provider (Optional)</label>
          <input
            type="text"
            value={formState.assetProvider || ''}
            onChange={(e) => onUpdate({ assetProvider: e.target.value })}
            placeholder="Team or person providing brand assets"
            className="w-full px-4 py-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
          />
        </div>

        {/* Approval Authority */}
        <div>
          <label className="block text-sm font-medium mb-2">Approval Authority (Optional)</label>
          <input
            type="text"
            value={formState.approvalAuthority || ''}
            onChange={(e) => onUpdate({ approvalAuthority: e.target.value })}
            placeholder="Team lead or manager"
            className="w-full px-4 py-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
          />
        </div>

        <div className="mt-6 p-4 rounded-lg bg-slate-800/30 border border-slate-700/30">
          <p className="text-sm text-slate-300">
            <span className="font-medium">Next Step:</span> We'll generate your complete content strategy including
            pillars, KPI targets, and a sample calendar template.
          </p>
        </div>
      </div>
    );
  }

  // Step 5: Review
  if (currentStep === 'review') {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold mb-2">Review & Confirm</h2>
          <p className="text-sm text-slate-400 mb-6">
            Your strategy has been generated. Review below and save to get started.
          </p>
        </div>

        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-slate-800/40 border border-slate-700/50">
            <div className="text-xs text-slate-500 mb-1">Brand Name</div>
            <div className="font-medium">{formState.brandName}</div>
          </div>

          <div className="p-4 rounded-lg bg-slate-800/40 border border-slate-700/50">
            <div className="text-xs text-slate-500 mb-1">Industry</div>
            <div className="font-medium">
              {formState.industry && INDUSTRY_TEMPLATES[formState.industry as Industry].name}
            </div>
          </div>

          <div className="p-4 rounded-lg bg-slate-800/40 border border-slate-700/50">
            <div className="text-xs text-slate-500 mb-1">Primary Goal</div>
            <div className="font-medium">
              {formState.businessGoal &&
                BUSINESS_GOALS.find(g => g.id === formState.businessGoal)?.name}
            </div>
          </div>

          <div className="p-4 rounded-lg bg-slate-800/40 border border-slate-700/50">
            <div className="text-xs text-slate-500 mb-1">Channels</div>
            <div className="font-medium text-sm">{formState.primaryChannels.join(', ')}</div>
          </div>

          <div className="p-4 rounded-lg bg-slate-800/40 border border-slate-700/50">
            <div className="text-xs text-slate-500 mb-1">Content Volume & Budget</div>
            <div className="font-medium text-sm">
              {formState.postsPerWeek} posts/week · HK${formState.monthlyBudgetHKD.toLocaleString()}/month
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 rounded-lg bg-green-500/10 border border-green-500/30">
          <p className="text-sm text-green-400">
            ✓ Your strategy is ready! Click "Save Brand" to store this profile and start building your content calendar.
          </p>
        </div>
      </div>
    );
  }

  return null;
}
