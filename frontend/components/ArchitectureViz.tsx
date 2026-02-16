'use client';

import { Shield, Workflow, FileText, Database, Users, Cpu, HardDrive, CheckCircle2, XCircle, Clock } from 'lucide-react';

type LayerStatus = 'active' | 'partial' | 'missing';

interface Layer {
  number: number;
  name: string;
  nameZh: string;
  description: string;
  components: string[];
  status: LayerStatus;
  icon: React.ElementType;
  color: string;
}

const layers: Layer[] = [
  {
    number: 7,
    name: 'Governance & Compliance',
    nameZh: '治理與合規',
    description: 'Tenant isolation, audit logging, access control, and data retention',
    components: ['Tenant Isolation', 'Audit Logging', 'Access Control', 'Data Retention', 'Compliance Tracking'],
    status: 'active',
    icon: Shield,
    color: 'purple',
  },
  {
    number: 6,
    name: 'Orchestration & Workflow',
    nameZh: '編排與工作流',
    description: 'Centralized schedule registry, scan queue, retry logic, and real-time updates',
    components: ['Schedule Registry', 'Topic Intelligence Scheduler', 'Ads Performance Orchestrator', 'Scan Queue', 'WebSocket Server', 'Health Monitor'],
    status: 'active',
    icon: Workflow,
    color: 'indigo',
  },
  {
    number: 5,
    name: 'Task Definitions',
    nameZh: '任務定義',
    description: 'Reusable task templates across all use cases',
    components: ['DailySyncTask', 'WeeklyAnalysisTask', 'MonthlyExecutiveSummary', 'DailyNewsDiscovery', 'WeeklyDigestWorkflow', 'SetupTopicWorkflow', 'CrossTenantOverview'],
    status: 'active',
    icon: FileText,
    color: 'blue',
  },
  {
    number: 4,
    name: 'Knowledge Management',
    nameZh: '知識管理',
    description: 'Vector embeddings, semantic search, and multi-source connectors',
    components: ['pgvector', 'Notion Connector', 'Vector Embeddings', 'Multi-source Connectors', 'Metric Definitions', 'Dropbox Connector'],
    status: 'active',
    icon: Database,
    color: 'cyan',
  },
  {
    number: 3,
    name: 'Roles & Agents',
    nameZh: '角色與代理',
    description: '30+ specialized AI agents across 5 use-case domains',
    components: ['9 Marketing Agents', '8 Ads Performance Agents', '9 Photo Booth Agents', '3 Topic Intelligence Agents', '1 Receipt OCR Agent'],
    status: 'active',
    icon: Users,
    color: 'green',
  },
  {
    number: 2,
    name: 'Execution Engine',
    nameZh: '執行引擎',
    description: 'Multi-provider AI integration with intelligent fallback chains',
    components: ['DeepSeek Service', 'Claude API', 'Perplexity Service', 'ComfyUI', 'Model Router', 'Internal LLM', 'Tesseract OCR', 'Sharp Image Processing'],
    status: 'active',
    icon: Cpu,
    color: 'orange',
  },
  {
    number: 1,
    name: 'Infrastructure & Storage',
    nameZh: '基礎設施與儲存',
    description: 'Database, APIs, real-time communication, and deployment infrastructure',
    components: ['PostgreSQL + pgvector', 'Express API', 'Docker / Fly.io', 'WebSocket (ws)', 'SSE Streaming', 'Redis (optional)'],
    status: 'active',
    icon: HardDrive,
    color: 'red',
  },
];

const statusConfig = {
  active: {
    label: 'Active',
    icon: CheckCircle2,
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    textColor: 'text-green-800 dark:text-green-300',
    borderColor: 'border-green-300 dark:border-green-700',
  },
  partial: {
    label: 'Partial',
    icon: Clock,
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    textColor: 'text-yellow-800 dark:text-yellow-300',
    borderColor: 'border-yellow-300 dark:border-yellow-700',
  },
  missing: {
    label: 'Missing',
    icon: XCircle,
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    textColor: 'text-red-800 dark:text-red-300',
    borderColor: 'border-red-300 dark:border-red-700',
  },
};

const colorClasses: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  purple: { bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-200 dark:border-purple-800', text: 'text-purple-900 dark:text-purple-100', icon: 'text-purple-600 dark:text-purple-400' },
  indigo: { bg: 'bg-indigo-50 dark:bg-indigo-900/20', border: 'border-indigo-200 dark:border-indigo-800', text: 'text-indigo-900 dark:text-indigo-100', icon: 'text-indigo-600 dark:text-indigo-400' },
  blue: { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800', text: 'text-blue-900 dark:text-blue-100', icon: 'text-blue-600 dark:text-blue-400' },
  cyan: { bg: 'bg-cyan-50 dark:bg-cyan-900/20', border: 'border-cyan-200 dark:border-cyan-800', text: 'text-cyan-900 dark:text-cyan-100', icon: 'text-cyan-600 dark:text-cyan-400' },
  green: { bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-800', text: 'text-green-900 dark:text-green-100', icon: 'text-green-600 dark:text-green-400' },
  orange: { bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-200 dark:border-orange-800', text: 'text-orange-900 dark:text-orange-100', icon: 'text-orange-600 dark:text-orange-400' },
  red: { bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800', text: 'text-red-900 dark:text-red-100', icon: 'text-red-600 dark:text-red-400' },
};

export default function ArchitectureViz() {
  const activeCount = layers.filter(l => l.status === 'active').length;
  const missingCount = layers.filter(l => l.status === 'missing').length;
  const completionPercentage = Math.round((activeCount / layers.length) * 100);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4">
          <div className="text-sm text-slate-600 dark:text-slate-400">Total Layers</div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{layers.length}</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4">
          <div className="text-sm text-slate-600 dark:text-slate-400">Active</div>
          <div className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">{activeCount}</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4">
          <div className="text-sm text-slate-600 dark:text-slate-400">Missing</div>
          <div className="text-3xl font-bold text-red-600 dark:text-red-400 mt-1">{missingCount}</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4">
          <div className="text-sm text-slate-600 dark:text-slate-400">Completion</div>
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-1">{completionPercentage}%</div>
        </div>
      </div>

      {/* Architecture Visualization */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            7-Layer Architecture
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Multi-layer agentic AI platform architecture
          </p>
        </div>

        <div className="space-y-3">
          {layers.map((layer, index) => {
            const Icon = layer.icon;
            const StatusIcon = statusConfig[layer.status].icon;
            const colors = colorClasses[layer.color];

            return (
              <div
                key={layer.number}
                className={`
                  relative border-2 rounded-lg transition-all duration-300 hover:shadow-md
                  ${colors.bg} ${colors.border}
                  ${layer.status === 'missing' ? 'opacity-60' : ''}
                `}
              >
                {/* Layer Number Badge */}
                <div className="absolute -left-3 -top-3 w-12 h-12 bg-white dark:bg-slate-700 rounded-full border-2 border-current flex items-center justify-center font-bold text-lg shadow-lg">
                  <span className={colors.text}>{layer.number}</span>
                </div>

                <div className="p-5 pl-12">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Icon className={`${colors.icon}`} size={24} />
                        <div>
                          <h3 className={`text-lg font-bold ${colors.text}`}>
                            {layer.name}
                          </h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {layer.nameZh}
                          </p>
                        </div>
                      </div>

                      <p className="text-sm text-slate-700 dark:text-slate-300 mb-3">
                        {layer.description}
                      </p>

                      <div className="flex flex-wrap gap-2">
                        {layer.components.map((component, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-white/60 dark:bg-slate-700/60 rounded-full text-xs font-medium text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600"
                          >
                            {component}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className={`
                      ml-4 px-3 py-1 rounded-full flex items-center gap-1 text-xs font-medium
                      ${statusConfig[layer.status].bgColor}
                      ${statusConfig[layer.status].textColor}
                    `}>
                      <StatusIcon size={14} />
                      {statusConfig[layer.status].label}
                    </div>
                  </div>
                </div>

                {/* Connection Line to Next Layer */}
                {index < layers.length - 1 && (
                  <div className="absolute left-6 -bottom-3 w-0.5 h-3 bg-slate-300 dark:bg-slate-600" />
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-6 text-sm">
            <span className="font-medium text-slate-700 dark:text-slate-300">Status Legend:</span>
            {Object.entries(statusConfig).map(([key, config]) => {
              const StatusIcon = config.icon;
              return (
                <div key={key} className={`flex items-center gap-2 px-3 py-1 rounded-full ${config.bgColor}`}>
                  <StatusIcon size={14} className={config.textColor} />
                  <span className={config.textColor}>{config.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
