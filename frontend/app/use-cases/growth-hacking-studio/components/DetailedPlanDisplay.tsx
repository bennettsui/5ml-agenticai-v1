'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Edit2, Save, X, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { useGrowthHackingStudio } from '../context';

interface PlanBlock {
  title: string;
  description: string;
  fields: { label: string; value: string | string[]; type: 'text' | 'textarea' | 'list' }[];
  riskLevel: 'low' | 'medium' | 'high';
  riskMitigation: string;
  timeline?: string;
}

interface DetailedPlanProps {
  plan: any;
}

export function DetailedPlanDisplay({ plan }: DetailedPlanProps) {
  const { currentPlan, setCurrentPlan } = useGrowthHackingStudio();
  const [expandedBlocks, setExpandedBlocks] = useState<{ [key: number]: boolean }>({
    0: true,
    1: true,
  });
  const [editingBlock, setEditingBlock] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [editData, setEditData] = useState<{ [key: number]: any }>({});

  // Initialize edit data from plan
  const initializeEditData = (blockIndex: number) => {
    if (!editData[blockIndex]) {
      const block = getBlocks()[blockIndex];
      setEditData((prev) => ({
        ...prev,
        [blockIndex]: {
          title: block.title,
          description: block.description,
          fields: block.fields.map((f) => ({ ...f })),
        },
      }));
    }
  };

  const getBlocks = (): PlanBlock[] => [
    {
      title: 'PMF & ICP',
      description: 'Product-Market Fit and Ideal Customer Profile',
      fields: [
        { label: 'Core Value Proposition', value: plan?.pmf?.value_prop || '', type: 'textarea' },
        { label: 'Target ICP Segments', value: plan?.pmf?.icp_segments || [], type: 'list' },
        { label: 'Key Differentiators', value: plan?.pmf?.differentiators || '', type: 'textarea' },
      ],
      riskLevel: plan?.risk?.pmf || 'medium',
      riskMitigation: plan?.risk?.pmf_mitigation || 'Validate with target users',
      timeline: 'Weeks 1-2',
    },
    {
      title: 'Funnel & Loops',
      description: 'Growth Loops and Conversion Funnels',
      fields: [
        { label: 'Primary Growth Loop', value: plan?.loops?.primary || '', type: 'textarea' },
        { label: 'Funnel Stages (TOFU/MOFU/BOFU)', value: plan?.loops?.funnel_stages || [], type: 'list' },
        { label: 'Viral/Referral Mechanics', value: plan?.loops?.viral_mechanics || '', type: 'textarea' },
      ],
      riskLevel: plan?.risk?.loops || 'medium',
      riskMitigation: plan?.risk?.loops_mitigation || 'Test conversion thresholds',
      timeline: 'Weeks 2-4',
    },
    {
      title: 'Assets',
      description: 'Content, Templates, and Systems',
      fields: [
        { label: 'Content Types', value: plan?.assets?.content_types || [], type: 'list' },
        { label: 'Templates & Tools', value: plan?.assets?.templates || '', type: 'textarea' },
        { label: 'Automation Systems', value: plan?.assets?.automation || '', type: 'textarea' },
      ],
      riskLevel: plan?.risk?.assets || 'low',
      riskMitigation: plan?.risk?.assets_mitigation || 'Use proven templates',
      timeline: 'Weeks 1-3',
    },
    {
      title: 'ROAS & Metrics',
      description: 'Financial Projections and Key Metrics',
      fields: [
        { label: 'Target CAC', value: plan?.metrics?.cac || '', type: 'text' },
        { label: 'Target LTV', value: plan?.metrics?.ltv || '', type: 'text' },
        { label: 'Key KPIs', value: plan?.metrics?.kpis || [], type: 'list' },
        { label: 'Growth Targets (30/60/90 days)', value: plan?.metrics?.targets || '', type: 'textarea' },
      ],
      riskLevel: plan?.risk?.metrics || 'high',
      riskMitigation: plan?.risk?.metrics_mitigation || 'Monthly ROAS review',
      timeline: 'Ongoing',
    },
    {
      title: 'Infrastructure',
      description: 'Technical Infrastructure and Tools',
      fields: [
        { label: 'Tech Stack', value: plan?.infrastructure?.tech_stack || [], type: 'list' },
        { label: 'Analytics & Tracking', value: plan?.infrastructure?.analytics || '', type: 'textarea' },
        { label: 'Automation & Integrations', value: plan?.infrastructure?.integrations || '', type: 'textarea' },
      ],
      riskLevel: plan?.risk?.infrastructure || 'low',
      riskMitigation: plan?.risk?.infrastructure_mitigation || 'Use battle-tested tools',
      timeline: 'Weeks 1-2',
    },
    {
      title: 'Weekly Review Cycle',
      description: 'Weekly Optimization and Learning Loop',
      fields: [
        { label: 'Weekly Metrics Review', value: plan?.weekly?.metrics_review || '', type: 'textarea' },
        { label: 'Experimentation Hypothesis', value: plan?.weekly?.hypothesis || '', type: 'textarea' },
        { label: 'Action Items & Wins', value: plan?.weekly?.actions || [], type: 'list' },
      ],
      riskLevel: plan?.risk?.weekly || 'low',
      riskMitigation: plan?.risk?.weekly_mitigation || 'Dedicated weekly meeting',
      timeline: 'Every Monday',
    },
  ];

  const blocks = getBlocks();

  const toggleBlock = (index: number) => {
    setExpandedBlocks((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const startEditing = (index: number) => {
    initializeEditData(index);
    setEditingBlock(index);
  };

  const handleFieldChange = (blockIndex: number, fieldIndex: number, value: string) => {
    setEditData((prev) => {
      const block = { ...prev[blockIndex] };
      block.fields[fieldIndex].value = value;
      return { ...prev, [blockIndex]: block };
    });
  };

  const handleListItemChange = (blockIndex: number, fieldIndex: number, itemIndex: number, value: string) => {
    setEditData((prev) => {
      const block = { ...prev[blockIndex] };
      const items = Array.isArray(block.fields[fieldIndex].value) ? block.fields[fieldIndex].value : [];
      items[itemIndex] = value;
      block.fields[fieldIndex].value = items;
      return { ...prev, [blockIndex]: block };
    });
  };

  const handleAddListItem = (blockIndex: number, fieldIndex: number) => {
    setEditData((prev) => {
      const block = { ...prev[blockIndex] };
      const items = Array.isArray(block.fields[fieldIndex].value) ? block.fields[fieldIndex].value : [];
      items.push('');
      block.fields[fieldIndex].value = items;
      return { ...prev, [blockIndex]: block };
    });
  };

  const handleSaveBlock = async (index: number) => {
    if (!currentPlan) return;

    setIsSaving(true);
    try {
      const updatedPlan = {
        ...currentPlan,
        plan_data: {
          ...currentPlan.plan_data,
          blocks: editData,
        },
      };

      const response = await fetch(`/api/growth/plan/${currentPlan.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedPlan),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setCurrentPlan(data.data);
      setEditingBlock(null);
    } catch (error: any) {
      console.error('Save error:', error);
      alert(`Error saving plan: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low':
        return 'text-green-400 bg-green-500/10 border-green-500/30';
      case 'medium':
        return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
      case 'high':
        return 'text-red-400 bg-red-500/10 border-red-500/30';
      default:
        return 'text-slate-400 bg-slate-500/10 border-slate-500/30';
    }
  };

  const getRiskIcon = (level: string) => {
    return level === 'low' ? (
      <CheckCircle className="w-4 h-4" />
    ) : (
      <AlertTriangle className="w-4 h-4" />
    );
  };

  return (
    <div className="space-y-4">
      {/* Timeline Overview */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-5 h-5 text-emerald-400" />
          <h3 className="text-sm font-semibold text-white">Implementation Timeline</h3>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-700/30 rounded p-3">
            <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Phase 1</p>
            <p className="text-sm text-slate-200 font-medium">Foundation</p>
            <p className="text-xs text-slate-500">Weeks 1-2</p>
          </div>
          <div className="bg-slate-700/30 rounded p-3">
            <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Phase 2</p>
            <p className="text-sm text-slate-200 font-medium">Execution</p>
            <p className="text-xs text-slate-500">Weeks 3-4</p>
          </div>
          <div className="bg-slate-700/30 rounded p-3">
            <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Phase 3</p>
            <p className="text-sm text-slate-200 font-medium">Scale & Optimize</p>
            <p className="text-xs text-slate-500">Week 5+</p>
          </div>
        </div>
      </div>

      {/* 6 Blocks */}
      <div className="space-y-3">
        {blocks.map((block, index) => (
          <div
            key={index}
            className="bg-slate-800/60 border border-slate-700/50 rounded-lg overflow-hidden transition-colors hover:border-slate-700/70"
          >
            {/* Block Header */}
            <button
              onClick={() => toggleBlock(index)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-700/20 transition-colors"
            >
              <div className="flex items-center gap-3 text-left flex-1">
                <div>
                  {expandedBlocks[index] ? (
                    <ChevronUp className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">{block.title}</h4>
                  <p className="text-xs text-slate-400">{block.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2.5 py-1 rounded-full border flex items-center gap-1 ${getRiskColor(block.riskLevel)}`}>
                  {getRiskIcon(block.riskLevel)}
                  {block.riskLevel.charAt(0).toUpperCase() + block.riskLevel.slice(1)} Risk
                </span>
              </div>
            </button>

            {/* Block Content */}
            {expandedBlocks[index] && (
              <div className="border-t border-slate-700/50 px-4 py-4 space-y-4">
                {/* Timeline */}
                {block.timeline && (
                  <div className="flex items-center gap-2 text-xs">
                    <Clock className="w-4 h-4 text-slate-500" />
                    <span className="text-slate-400">{block.timeline}</span>
                  </div>
                )}

                {/* Risk Mitigation */}
                <div className="bg-slate-700/20 rounded p-3">
                  <p className="text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wide">Risk Mitigation</p>
                  <p className="text-sm text-slate-300">{block.riskMitigation}</p>
                </div>

                {/* Fields - View Mode */}
                {editingBlock !== index && (
                  <div className="space-y-3">
                    {block.fields.map((field, fieldIndex) => (
                      <div key={fieldIndex}>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">{field.label}</p>
                        {field.type === 'list' ? (
                          <ul className="space-y-1">
                            {Array.isArray(field.value) && field.value.length > 0 ? (
                              field.value.map((item, itemIndex) => (
                                <li key={itemIndex} className="text-sm text-slate-300">
                                  • {item}
                                </li>
                              ))
                            ) : (
                              <li className="text-sm text-slate-500 italic">No items</li>
                            )}
                          </ul>
                        ) : (
                          <p className="text-sm text-slate-300">{field.value || '—'}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Fields - Edit Mode */}
                {editingBlock === index && editData[index] && (
                  <div className="space-y-4 bg-slate-700/20 rounded p-4">
                    {editData[index].fields.map((field: any, fieldIndex: number) => (
                      <div key={fieldIndex}>
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 block">
                          {field.label}
                        </label>
                        {field.type === 'textarea' ? (
                          <textarea
                            value={field.value}
                            onChange={(e) => handleFieldChange(index, fieldIndex, e.target.value)}
                            rows={3}
                            className="w-full bg-white/[0.02] border border-slate-700/50 rounded px-3 py-2 text-sm text-white placeholder-slate-500"
                            placeholder={`Enter ${field.label.toLowerCase()}…`}
                          />
                        ) : field.type === 'list' ? (
                          <div className="space-y-2">
                            {Array.isArray(field.value) &&
                              field.value.map((item: string, itemIndex: number) => (
                                <input
                                  key={itemIndex}
                                  type="text"
                                  value={item}
                                  onChange={(e) => handleListItemChange(index, fieldIndex, itemIndex, e.target.value)}
                                  className="w-full bg-white/[0.02] border border-slate-700/50 rounded px-3 py-2 text-sm text-white placeholder-slate-500"
                                  placeholder={`Item ${itemIndex + 1}`}
                                />
                              ))}
                            <button
                              onClick={() => handleAddListItem(index, fieldIndex)}
                              className="w-full px-3 py-2 bg-slate-700/30 hover:bg-slate-700/50 rounded border border-slate-700/50 text-xs text-slate-300 transition-colors"
                            >
                              + Add Item
                            </button>
                          </div>
                        ) : (
                          <input
                            type="text"
                            value={field.value}
                            onChange={(e) => handleFieldChange(index, fieldIndex, e.target.value)}
                            className="w-full bg-white/[0.02] border border-slate-700/50 rounded px-3 py-2 text-sm text-white placeholder-slate-500"
                            placeholder={`Enter ${field.label.toLowerCase()}…`}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Block Actions */}
                <div className="flex gap-2 pt-2 border-t border-slate-700/50">
                  {editingBlock === index ? (
                    <>
                      <button
                        onClick={() => handleSaveBlock(index)}
                        disabled={isSaving}
                        className="flex-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded text-sm font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <Save className="w-4 h-4" />
                        {isSaving ? 'Saving…' : 'Save Changes'}
                      </button>
                      <button
                        onClick={() => setEditingBlock(null)}
                        className="flex-1 px-3 py-2 bg-slate-700/50 hover:bg-slate-700 text-white rounded text-sm font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => startEditing(index)}
                      className="flex-1 px-3 py-2 bg-slate-700/50 hover:bg-slate-700 text-white rounded text-sm font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit Block
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Overall Risk Summary */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-white mb-3">Overall Plan Health</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-700/20 rounded p-3">
            <p className="text-xs text-slate-400 mb-1">High Risk Blocks</p>
            <p className="text-lg font-bold text-red-400">
              {blocks.filter((b) => b.riskLevel === 'high').length}
            </p>
          </div>
          <div className="bg-slate-700/20 rounded p-3">
            <p className="text-xs text-slate-400 mb-1">Ready to Execute</p>
            <p className="text-lg font-bold text-green-400">
              {blocks.filter((b) => b.riskLevel === 'low').length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
