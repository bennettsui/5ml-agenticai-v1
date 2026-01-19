'use client';

import { useState, useEffect, useRef } from 'react';
import { Sparkles, Search, Share2, TrendingUp, Loader2, Building2, Plus, Clock, ChevronDown, ChevronUp, Send, User, Bot } from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  description: string;
  capabilities: string[];
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  brief?: string;
  model?: string;
  timestamp: string;
}

const agents: Agent[] = [
  {
    id: 'social',
    name: 'Social Media Agent',
    icon: Share2,
    color: 'green',
    description: 'Creates comprehensive social media strategies with trending format analysis',
    capabilities: ['Platform selection', 'Content pillars', 'Posting frequency', 'Engagement strategy', 'Hashtag strategy'],
  },
  {
    id: 'research',
    name: 'Brand Research Agent',
    icon: TrendingUp,
    color: 'orange',
    description: 'Brand status research expert combining real-time intelligence with brand asset auditing',
    capabilities: ['Brand audit', 'Real-time intelligence', 'Product analysis', 'VOC analysis', 'Positioning verification'],
  },
  {
    id: 'seo',
    name: 'SEO Agent',
    icon: Search,
    color: 'blue',
    description: 'Comprehensive SEO analysis and optimization recommendations',
    capabilities: ['Keyword research', 'Content strategy', 'Technical SEO', 'Backlink opportunities', 'Trend analysis'],
  },
  {
    id: 'creative',
    name: 'Creative Agent',
    icon: Sparkles,
    color: 'purple',
    description: 'Creative content generation and campaign ideation',
    capabilities: ['Campaign concepts', 'Creative copy', 'Content ideas', 'Brand storytelling', 'Visual direction'],
  },
];

const models = [
  { id: 'deepseek', name: 'DeepSeek Reasoner', description: 'Fast & affordable' },
  { id: 'haiku', name: 'Claude Haiku', description: 'General purpose' },
  { id: 'perplexity', name: 'Perplexity Sonar Pro', description: 'Real-time research' },
];

const colorClasses: Record<string, { bg: string; border: string; icon: string; button: string; text: string }> = {
  purple: { bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-200 dark:border-purple-700', icon: 'text-purple-600 dark:text-purple-400', button: 'bg-purple-600 hover:bg-purple-700', text: 'text-purple-600 dark:text-purple-400' },
  blue: { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-700', icon: 'text-blue-600 dark:text-blue-400', button: 'bg-blue-600 hover:bg-blue-700', text: 'text-blue-600 dark:text-blue-400' },
  green: { bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-700', icon: 'text-green-600 dark:text-green-400', button: 'bg-green-600 hover:bg-green-700', text: 'text-green-600 dark:text-green-400' },
  orange: { bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-200 dark:border-orange-700', icon: 'text-orange-600 dark:text-orange-400', button: 'bg-orange-600 hover:bg-orange-700', text: 'text-orange-600 dark:text-orange-400' },
};

export default function AgentTesting() {
  const [selectedBrand, setSelectedBrand] = useState<any>(null);
  const [allBrands, setAllBrands] = useState<any[]>([]);
  const [brandSearchQuery, setBrandSearchQuery] = useState('');
  const [showNewBrandForm, setShowNewBrandForm] = useState(false);
  const [initialBrief, setInitialBrief] = useState('');
  const [industry, setIndustry] = useState('');
  const [newBrandName, setNewBrandName] = useState('');

  // Chat state per agent
  const [agentChats, setAgentChats] = useState<Record<string, Message[]>>({
    social: [],
    research: [],
    seo: [],
    creative: [],
  });
  const [expandedAgents, setExpandedAgents] = useState<Record<string, boolean>>({});
  const [agentInputs, setAgentInputs] = useState<Record<string, string>>({});
  const [agentModels, setAgentModels] = useState<Record<string, string>>({
    social: 'deepseek',
    research: 'deepseek',
    seo: 'deepseek',
    creative: 'deepseek',
  });
  const [loadingAgents, setLoadingAgents] = useState<Record<string, boolean>>({});

  // Load all brands on mount
  useEffect(() => {
    loadBrands();
  }, []);

  const loadBrands = async () => {
    try {
      const response = await fetch('/api/brands?limit=20');
      const data = await response.json();
      if (data.success) {
        setAllBrands(data.brands || []);
      }
    } catch (error) {
      console.error('Error loading brands:', error);
    }
  };

  // Load brand details and convert agent results to chat history
  const handleBrandSelect = async (brand: any) => {
    try {
      const response = await fetch(`/api/brands/${encodeURIComponent(brand.brand_name)}`);
      const data = await response.json();
      if (data.success) {
        setSelectedBrand(data.brand);
        setInitialBrief(data.brand.brand_info?.brief || '');
        setIndustry(data.brand.industry || '');

        // Convert agent_results to chat format
        const chats: Record<string, Message[]> = {
          social: [],
          research: [],
          seo: [],
          creative: [],
        };

        if (data.brand.agent_results) {
          Object.entries(data.brand.agent_results).forEach(([agentId, result]: [string, any]) => {
            if (chats[agentId]) {
              // Add initial exchange to chat history
              chats[agentId].push({
                role: 'user',
                content: 'Initial analysis request',
                brief: data.brand.brand_info?.brief || '',
                timestamp: new Date(data.brand.updated_at).toISOString(),
              });
              chats[agentId].push({
                role: 'assistant',
                content: typeof result === 'string' ? result : JSON.stringify(result, null, 2),
                model: result._meta?.model,
                timestamp: new Date(data.brand.updated_at).toISOString(),
              });
            }
          });
        }

        setAgentChats(chats);
        setShowNewBrandForm(false);
      }
    } catch (error) {
      console.error('Error loading brand details:', error);
      setSelectedBrand(brand);
    }
  };

  const handleCreateBrand = async () => {
    if (!newBrandName || !initialBrief || !industry) return;

    try {
      const response = await fetch('/api/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand_name: newBrandName,
          industry,
          brand_info: { brief: initialBrief },
        }),
      });

      const data = await response.json();
      if (data.success) {
        await loadBrands();
        await handleBrandSelect(data.brand);
        setNewBrandName('');
      }
    } catch (error) {
      console.error('Error creating brand:', error);
    }
  };

  const sendMessageToAgent = async (agentId: string) => {
    const message = agentInputs[agentId]?.trim();
    if (!message || !selectedBrand) return;

    // Add user message to chat
    const userMessage: Message = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };

    setAgentChats(prev => ({
      ...prev,
      [agentId]: [...prev[agentId], userMessage],
    }));

    setAgentInputs(prev => ({ ...prev, [agentId]: '' }));
    setLoadingAgents(prev => ({ ...prev, [agentId]: true }));

    try {
      const response = await fetch(`/agents/${agentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_name: selectedBrand.brand_name,
          brief: message,
          industry: selectedBrand.industry,
          model: agentModels[agentId],
        }),
      });

      const data = await response.json();

      // Add assistant response to chat
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.error ? `Error: ${data.error}` : (typeof data.analysis === 'string' ? data.analysis : JSON.stringify(data.analysis, null, 2)),
        model: agentModels[agentId],
        timestamp: new Date().toISOString(),
      };

      setAgentChats(prev => ({
        ...prev,
        [agentId]: [...prev[agentId], assistantMessage],
      }));

      // Reload brand to update metadata
      await handleBrandSelect({ brand_name: selectedBrand.brand_name });
      await loadBrands();
    } catch (error) {
      const errorMessage: Message = {
        role: 'assistant',
        content: `Error: Failed to get response from agent`,
        timestamp: new Date().toISOString(),
      };

      setAgentChats(prev => ({
        ...prev,
        [agentId]: [...prev[agentId], errorMessage],
      }));
    } finally {
      setLoadingAgents(prev => ({ ...prev, [agentId]: false }));
    }
  };

  const toggleAgent = (agentId: string) => {
    setExpandedAgents(prev => ({ ...prev, [agentId]: !prev[agentId] }));
  };

  const filteredBrands = brandSearchQuery
    ? allBrands.filter(b =>
        b.brand_name.toLowerCase().includes(brandSearchQuery.toLowerCase()) ||
        (b.industry && b.industry.toLowerCase().includes(brandSearchQuery.toLowerCase()))
      )
    : allBrands;

  return (
    <div className="space-y-6">
      {/* Brand Selection */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 size={24} />
            Select Brand
          </h2>
          <button
            onClick={() => {
              setShowNewBrandForm(!showNewBrandForm);
              setSelectedBrand(null);
              setNewBrandName('');
              setInitialBrief('');
              setIndustry('');
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
          >
            <Plus size={18} />
            New Brand
          </button>
        </div>

        {/* New Brand Form */}
        {showNewBrandForm && (
          <div className="mb-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg space-y-3">
            <input
              type="text"
              value={newBrandName}
              onChange={(e) => setNewBrandName(e.target.value)}
              placeholder="Brand Name"
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            />
            <input
              type="text"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="Industry"
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            />
            <textarea
              value={initialBrief}
              onChange={(e) => setInitialBrief(e.target.value)}
              placeholder="Initial brief for this brand..."
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 h-24"
            />
            <button
              onClick={handleCreateBrand}
              disabled={!newBrandName || !initialBrief || !industry}
              className="w-full py-2 px-4 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-400 text-white rounded-lg transition-colors"
            >
              Create Brand
            </button>
          </div>
        )}

        {/* Search Bar */}
        {!showNewBrandForm && (
          <div className="mb-4">
            <input
              type="text"
              value={brandSearchQuery}
              onChange={(e) => setBrandSearchQuery(e.target.value)}
              placeholder="Search brands..."
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            />
          </div>
        )}

        {/* Brand List */}
        {!showNewBrandForm && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
            {filteredBrands.length === 0 ? (
              <div className="col-span-full text-center py-8 text-slate-500 dark:text-slate-400">
                No brands found. Click "New Brand" to create one.
              </div>
            ) : (
              filteredBrands.map((brand) => (
                <button
                  key={brand.brand_id}
                  onClick={() => handleBrandSelect(brand)}
                  className={`
                    p-4 rounded-lg border-2 transition-all text-left
                    ${selectedBrand?.brand_id === brand.brand_id
                      ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-500 shadow-md'
                      : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 hover:border-primary-300'
                    }
                  `}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white">{brand.brand_name}</h3>
                      {brand.industry && (
                        <p className="text-xs text-slate-600 dark:text-slate-400">{brand.industry}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                    <span>{brand.usage_count || 0} runs</span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {new Date(brand.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Selected Brand and Initial Brief */}
      {selectedBrand && (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{selectedBrand.brand_name}</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">{selectedBrand.industry}</p>
            </div>
            <button
              onClick={() => setSelectedBrand(null)}
              className="text-sm text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            >
              Change Brand
            </button>
          </div>
          {initialBrief && (
            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Initial Brief:</h3>
              <p className="text-sm text-slate-700 dark:text-slate-300">{initialBrief}</p>
            </div>
          )}
        </div>
      )}

      {/* Agent Chat Sections */}
      {selectedBrand && (
        <div className="space-y-4">
          {agents.map((agent) => {
            const Icon = agent.icon;
            const colors = colorClasses[agent.color];
            const isExpanded = expandedAgents[agent.id];
            const chatHistory = agentChats[agent.id] || [];
            const hasMessages = chatHistory.length > 0;

            return (
              <div key={agent.id} className="bg-white dark:bg-slate-800 rounded-lg shadow-lg overflow-hidden">
                {/* Agent Header */}
                <button
                  onClick={() => toggleAgent(agent.id)}
                  className="w-full p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${colors.bg}`}>
                      <Icon className={colors.icon} size={20} />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-slate-900 dark:text-white">{agent.name}</h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400">{agent.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {hasMessages && (
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {Math.floor(chatHistory.length / 2)} messages
                      </span>
                    )}
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </button>

                {/* Chat Interface */}
                {isExpanded && (
                  <div className="border-t border-slate-200 dark:border-slate-700">
                    {/* Chat History */}
                    {chatHistory.length > 0 && (
                      <div className="p-4 space-y-3 max-h-96 overflow-y-auto bg-slate-50 dark:bg-slate-900">
                        {chatHistory.map((msg, idx) => (
                          <div
                            key={idx}
                            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            {msg.role === 'assistant' && (
                              <div className={`p-2 rounded-full ${colors.bg} flex-shrink-0`}>
                                <Bot className={colors.icon} size={16} />
                              </div>
                            )}
                            <div
                              className={`max-w-[80%] rounded-lg p-3 ${
                                msg.role === 'user'
                                  ? 'bg-primary-600 text-white'
                                  : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700'
                              }`}
                            >
                              <div className="text-sm whitespace-pre-wrap break-words">{msg.content}</div>
                              <div className="text-xs mt-1 opacity-70">
                                {msg.model && `${msg.model} • `}
                                {new Date(msg.timestamp).toLocaleTimeString()}
                              </div>
                            </div>
                            {msg.role === 'user' && (
                              <div className="p-2 rounded-full bg-primary-100 dark:bg-primary-900/20 flex-shrink-0">
                                <User className="text-primary-600 dark:text-primary-400" size={16} />
                              </div>
                            )}
                          </div>
                        ))}
                        {loadingAgents[agent.id] && (
                          <div className="flex gap-3 justify-start">
                            <div className={`p-2 rounded-full ${colors.bg} flex-shrink-0`}>
                              <Bot className={colors.icon} size={16} />
                            </div>
                            <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                              <Loader2 className="animate-spin text-slate-600" size={16} />
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Input Area */}
                    <div className="p-4 bg-white dark:bg-slate-800">
                      <div className="flex gap-2 mb-3">
                        <select
                          value={agentModels[agent.id]}
                          onChange={(e) => setAgentModels(prev => ({ ...prev, [agent.id]: e.target.value }))}
                          className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                        >
                          {models.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={agentInputs[agent.id] || ''}
                          onChange={(e) => setAgentInputs(prev => ({ ...prev, [agent.id]: e.target.value }))}
                          onKeyPress={(e) => e.key === 'Enter' && !loadingAgents[agent.id] && sendMessageToAgent(agent.id)}
                          placeholder={chatHistory.length === 0 ? "Start conversation..." : "Ask a follow-up question..."}
                          className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                          disabled={loadingAgents[agent.id]}
                        />
                        <button
                          onClick={() => sendMessageToAgent(agent.id)}
                          disabled={!agentInputs[agent.id]?.trim() || loadingAgents[agent.id]}
                          className={`px-4 py-2 rounded-lg text-white font-medium transition-colors ${colors.button} disabled:bg-slate-400 disabled:cursor-not-allowed`}
                        >
                          <Send size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
