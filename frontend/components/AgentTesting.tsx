'use client';

import { useState, useEffect, useRef } from 'react';
import { Sparkles, Search, Share2, TrendingUp, Loader2, Building2, Plus, Clock, ChevronDown, ChevronUp, Send, User, Bot, History } from 'lucide-react';

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
  parsed?: any;
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

// JSON rendering component
function RenderJSON({ data }: { data: any }) {
  if (typeof data === 'string') {
    return <div className="whitespace-pre-wrap">{data}</div>;
  }

  if (typeof data !== 'object' || data === null) {
    return <div>{String(data)}</div>;
  }

  // Skip _meta field
  const { _meta, ...content } = data;

  const renderValue = (value: any, key?: string): React.ReactNode => {
    if (value === null || value === undefined) {
      return <span className="text-slate-400">-</span>;
    }

    if (typeof value === 'string') {
      return <span className="text-slate-700 dark:text-slate-300">{value}</span>;
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
      return <span className="text-blue-600 dark:text-blue-400">{String(value)}</span>;
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return <span className="text-slate-400">[]</span>;
      }

      // Check if array of objects (table format)
      if (value.length > 0 && typeof value[0] === 'object' && !Array.isArray(value[0])) {
        return (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700 text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800">
                <tr>
                  {Object.keys(value[0]).map((header) => (
                    <th key={header} className="px-3 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      {header.replace(/_/g, ' ')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-700">
                {value.map((row, idx) => (
                  <tr key={idx}>
                    {Object.values(row).map((cell, cellIdx) => (
                      <td key={cellIdx} className="px-3 py-2 whitespace-normal text-slate-700 dark:text-slate-300">
                        {renderValue(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }

      // Regular array
      return (
        <ul className="list-disc list-inside space-y-1 ml-2">
          {value.map((item, idx) => (
            <li key={idx} className="text-slate-700 dark:text-slate-300">
              {renderValue(item)}
            </li>
          ))}
        </ul>
      );
    }

    if (typeof value === 'object') {
      return (
        <div className="ml-4 space-y-2">
          {Object.entries(value).map(([k, v]) => (
            <div key={k}>
              <span className="font-semibold text-slate-900 dark:text-white">{k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: </span>
              {renderValue(v, k)}
            </div>
          ))}
        </div>
      );
    }

    return <span>{String(value)}</span>;
  };

  return (
    <div className="space-y-4">
      {Object.entries(content).map(([key, value]) => (
        <div key={key} className="border-l-2 border-slate-300 dark:border-slate-600 pl-4">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
            {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </h4>
          {renderValue(value, key)}
        </div>
      ))}
    </div>
  );
}

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

  // History state
  const [conversationHistory, setConversationHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);

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

  // Load conversation history for brand
  const loadConversationHistory = async (brandName: string) => {
    try {
      const response = await fetch(`/api/conversations/${encodeURIComponent(brandName)}`);
      const data = await response.json();
      if (data.success) {
        setConversationHistory(data.conversations || []);
      }
    } catch (error) {
      console.error('Error loading conversation history:', error);
      setConversationHistory([]);
    }
  };

  // Load a specific conversation
  const loadConversation = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/conversation/${conversationId}`);
      const data = await response.json();
      if (data.success) {
        const conv = data.conversation;
        setInitialBrief(conv.initial_brief || '');

        // Set the agent chat with the loaded messages
        const messages = conv.messages || [];
        setAgentChats(prev => ({
          ...prev,
          [conv.agent_type]: messages,
        }));

        // Expand the agent automatically
        setExpandedAgents(prev => ({
          ...prev,
          [conv.agent_type]: true,
        }));

        setCurrentConversationId(conversationId);
        setShowHistory(false);
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  };

  // Save current conversation
  const saveCurrentConversation = async (agentType: string) => {
    if (!selectedBrand || !agentChats[agentType] || agentChats[agentType].length === 0) return;

    try {
      await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand_name: selectedBrand.brand_name,
          agent_type: agentType,
          initial_brief: initialBrief,
          messages: agentChats[agentType],
        }),
      });

      // Reload history
      await loadConversationHistory(selectedBrand.brand_name);
    } catch (error) {
      console.error('Error saving conversation:', error);
    }
  };

  // Load brand details and reset chat
  const handleBrandSelect = async (brand: any) => {
    try {
      const response = await fetch(`/api/brands/${encodeURIComponent(brand.brand_name)}`);
      const data = await response.json();
      if (data.success) {
        setSelectedBrand(data.brand);
        setInitialBrief(data.brand.brand_info?.brief || '');
        setIndustry(data.brand.industry || '');

        // Reset chats for new brand selection
        setAgentChats({
          social: [],
          research: [],
          seo: [],
          creative: [],
        });

        setCurrentConversationId(null);
        setShowNewBrandForm(false);

        // Load conversation history
        await loadConversationHistory(brand.brand_name);
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
      // Build conversation context: initial brief + all previous messages + current message
      const conversationHistory = agentChats[agentId] || [];
      const contextMessages = conversationHistory
        .filter(msg => msg.role === 'user')
        .map(msg => msg.content);

      const fullContext = initialBrief
        ? `Initial Brief: ${initialBrief}\n\nPrevious questions:\n${contextMessages.join('\n')}\n\nCurrent question: ${message}`
        : `Previous questions:\n${contextMessages.join('\n')}\n\nCurrent question: ${message}`;

      const response = await fetch(`/agents/${agentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_name: selectedBrand.brand_name,
          brief: fullContext,
          industry: selectedBrand.industry,
          model: agentModels[agentId],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      // Parse and format the response
      let parsedContent = null;
      let displayContent = '';

      if (data.error) {
        displayContent = `Error: ${data.error}`;
      } else if (data.analysis) {
        parsedContent = data.analysis;
        displayContent = typeof data.analysis === 'string' ? data.analysis : '';
      } else {
        displayContent = 'No analysis data received';
      }

      // Add assistant response to chat
      const assistantMessage: Message = {
        role: 'assistant',
        content: displayContent,
        parsed: parsedContent,
        model: agentModels[agentId],
        timestamp: new Date().toISOString(),
      };

      setAgentChats(prev => ({
        ...prev,
        [agentId]: [...prev[agentId], assistantMessage],
      }));

      // Reload brand list to update usage count
      await loadBrands();
    } catch (error: any) {
      const errorMessage: Message = {
        role: 'assistant',
        content: `Error: ${error.message || 'Failed to get response from agent'}`,
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
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center gap-2 px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <History size={16} />
                History ({conversationHistory.length})
              </button>
              <button
                onClick={() => setSelectedBrand(null)}
                className="text-sm text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
              >
                Change Brand
              </button>
            </div>
          </div>
          {initialBrief && (
            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Initial Brief:</h3>
              <p className="text-sm text-slate-700 dark:text-slate-300">{initialBrief}</p>
            </div>
          )}
        </div>
      )}

      {/* Conversation History Panel */}
      {selectedBrand && showHistory && (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <History size={20} />
              Conversation History
            </h3>
            <button
              onClick={() => setShowHistory(false)}
              className="text-sm text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            >
              Close
            </button>
          </div>

          {conversationHistory.length === 0 ? (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              No conversation history yet. Start chatting with an agent to create history.
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {conversationHistory.map((conv) => {
                const agent = agents.find(a => a.id === conv.agent_type);
                const Icon = agent?.icon || TrendingUp;
                const colors = agent ? colorClasses[agent.color] : colorClasses.orange;
                const messageCount = Array.isArray(conv.messages) ? conv.messages.length : 0;
                const exchanges = Math.floor(messageCount / 2);

                return (
                  <div
                    key={conv.conversation_id}
                    className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-primary-500 dark:hover:border-primary-500 transition-colors cursor-pointer"
                    onClick={() => loadConversation(conv.conversation_id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${colors.bg} flex-shrink-0`}>
                        <Icon className={colors.icon} size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-semibold text-slate-900 dark:text-white">
                            {agent?.name || conv.agent_type}
                          </h4>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {exchanges} exchanges
                          </span>
                        </div>
                        {conv.initial_brief && (
                          <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mb-2">
                            {conv.initial_brief}
                          </p>
                        )}
                        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                          <span>
                            Created: {new Date(conv.created_at).toLocaleDateString()} {new Date(conv.created_at).toLocaleTimeString()}
                          </span>
                          {conv.updated_at !== conv.created_at && (
                            <span>
                              Updated: {new Date(conv.updated_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
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
                        {Math.floor(chatHistory.length / 2)} exchanges
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
                              <div className={`p-2 rounded-full ${colors.bg} flex-shrink-0 self-start`}>
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
                              {msg.role === 'assistant' && msg.parsed ? (
                                <RenderJSON data={msg.parsed} />
                              ) : (
                                <div className="text-sm whitespace-pre-wrap break-words">{msg.content}</div>
                              )}
                              <div className={`text-xs mt-2 ${msg.role === 'user' ? 'opacity-80' : 'opacity-60'}`}>
                                {msg.model && `${msg.model} • `}
                                {new Date(msg.timestamp).toLocaleTimeString()}
                              </div>
                            </div>
                            {msg.role === 'user' && (
                              <div className="p-2 rounded-full bg-primary-100 dark:bg-primary-900/20 flex-shrink-0 self-start">
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
                          className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                        >
                          {models.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name}
                            </option>
                          ))}
                        </select>
                        {hasMessages && (
                          <button
                            onClick={() => saveCurrentConversation(agent.id)}
                            className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-1"
                            title="Save this conversation"
                          >
                            <History size={16} />
                            Save
                          </button>
                        )}
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
