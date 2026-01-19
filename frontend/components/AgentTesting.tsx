'use client';

import { useState, useEffect, useRef } from 'react';
import { Sparkles, Search, Share2, TrendingUp, Loader2, Building2, Plus, Clock, ChevronDown, ChevronUp, Send, User, Bot, History, Trash2 } from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  description: string;
  capabilities: string[];
  category: 'agentic_ai' | 'workflow' | 'ai_agents';
}

interface AgentCategory {
  id: string;
  name: string;
  description: string;
  agents: Agent[];
}

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  parsed?: any;
  brief?: string;
  model?: string;
  timestamp: string;
  agent?: string;
}

const agents: Agent[] = [
  {
    id: 'orchestrator',
    name: '品牌策略指揮官',
    icon: Sparkles,
    color: 'purple',
    description: 'Agentic AI - Orchestrates all agents with autonomous planning and goal-oriented execution',
    capabilities: ['Autonomous planning', 'Multi-agent orchestration', 'Data quality reflection', 'Goal-oriented execution', 'Self-correction'],
    category: 'agentic_ai',
  },
  {
    id: 'research',
    name: '品牌現狀研究專家',
    icon: TrendingUp,
    color: 'orange',
    description: 'Brand Research Agent - Real-time brand audit with market intelligence and asset analysis',
    capabilities: ['Real-time intelligence', '3Cs & SWOT analysis', 'Product & pricing', 'VOC analysis', 'Brand asset audit'],
    category: 'ai_agents',
  },
  {
    id: 'customer',
    name: '用戶洞察專家',
    icon: User,
    color: 'blue',
    description: 'Customer Insight Agent - Deep audience segmentation and psychological motivation analysis',
    capabilities: ['Market segmentation', 'TA positioning', 'Persona building', 'Empathy mapping', 'Purchase triggers'],
    category: 'ai_agents',
  },
  {
    id: 'competitor',
    name: '競爭情報專家',
    icon: Search,
    color: 'green',
    description: 'Competitor Analysis Agent - Intelligence gathering and differentiation opportunity mapping',
    capabilities: ['Competitive radar', 'Benchmarking', 'Market dynamics', 'Differentiation analysis', 'SOV estimation'],
    category: 'ai_agents',
  },
  {
    id: 'strategy',
    name: '品牌策略分析專家',
    icon: Sparkles,
    color: 'purple',
    description: 'Brand Strategy Agent - Strategic diagnosis and actionable blueprint development',
    capabilities: ['Strategic diagnosis', 'SWOT strategy', 'Brand archetype', 'Positioning statement', 'Action blueprint'],
    category: 'ai_agents',
  },
];

const agentCategories: AgentCategory[] = [
  {
    id: 'agentic_ai',
    name: 'Agentic AI',
    description: 'Autonomous orchestration with multi-agent coordination',
    agents: agents.filter(a => a.category === 'agentic_ai'),
  },
  {
    id: 'workflow',
    name: 'Workflow',
    description: 'Pre-defined workflows for common tasks',
    agents: agents.filter(a => a.category === 'workflow'),
  },
  {
    id: 'ai_agents',
    name: 'AI Agents',
    description: 'Specialized research and analysis agents',
    agents: agents.filter(a => a.category === 'ai_agents'),
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
  const [industry, setIndustry] = useState('');
  const [newBrandName, setNewBrandName] = useState('');

  // Tab state
  const [activeTab, setActiveTab] = useState<'projects' | 'agents'>('projects');

  // Project state
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [showNewProjectForm, setShowNewProjectForm] = useState(false);
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [newProjectPurpose, setNewProjectPurpose] = useState('');
  const [newProjectDeliverable, setNewProjectDeliverable] = useState('');
  const [newProjectBackground, setNewProjectBackground] = useState('');

  // Unified chat state
  const [conversation, setConversation] = useState<Message[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [selectedModel, setSelectedModel] = useState('deepseek');
  const [isLoading, setIsLoading] = useState(false);

  // Agent sidebar state
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    agentic_ai: true,
    workflow: false,
    ai_agents: true,
  });

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

  // Load projects for brand
  const loadProjects = async (brandName: string) => {
    try {
      const response = await fetch(`/api/brands/${encodeURIComponent(brandName)}/projects`);
      const data = await response.json();
      if (data.success) {
        setProjects(data.projects || []);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
      setProjects([]);
    }
  };

  // Create a new project
  const handleCreateProject = async () => {
    if (!newProjectTitle.trim() && !newProjectPurpose.trim()) return;

    const newProject = {
      title: newProjectTitle,
      purpose: newProjectPurpose,
      deliverable: newProjectDeliverable,
      background: newProjectBackground,
      brief: `Title: ${newProjectTitle}\nPurpose: ${newProjectPurpose}\nDeliverable: ${newProjectDeliverable}${newProjectBackground ? `\nBackground: ${newProjectBackground}` : ''}`,
      conversations: [],
      conversation_count: 0,
      created_at: new Date().toISOString(),
      last_updated: new Date().toISOString(),
      isNew: true,
    };

    setSelectedProject(newProject);
    setShowNewProjectForm(false);
    setActiveTab('agents');
    setConversation([]);

    // Clear form
    setNewProjectTitle('');
    setNewProjectPurpose('');
    setNewProjectDeliverable('');
    setNewProjectBackground('');

    // Add system message to conversation
    const systemMessage: Message = {
      role: 'system',
      content: `New project created: ${newProjectTitle}. Select an agent from the left sidebar to begin analysis.`,
      timestamp: new Date().toISOString(),
    };
    setConversation([systemMessage]);
  };

  // DEPRECATED: Old auto-send function - now using unified conversation model
  // Kept for reference, to be removed after migration is complete

  // Select an existing project
  const handleSelectProject = async (project: any) => {
    setSelectedProject(project);
    setActiveTab('agents');

    // Reset conversation
    const allMessages: Message[] = [];

    // Load all conversations for this project and merge into unified conversation
    if (project.conversations && project.conversations.length > 0) {
      for (const conv of project.conversations) {
        try {
          const response = await fetch(`/api/conversation/${conv.conversation_id}`);
          const data = await response.json();
          if (data.success && data.conversation.messages) {
            // Tag each message with its agent
            const taggedMessages = data.conversation.messages.map((msg: Message) => ({
              ...msg,
              agent: conv.agent_type,
            }));
            allMessages.push(...taggedMessages);
          }
        } catch (error) {
          console.error('Error loading conversation:', error);
        }
      }
    }

    // Sort by timestamp
    allMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    setConversation(allMessages);

    // Add welcome message if no conversations exist
    if (allMessages.length === 0) {
      const welcomeMessage: Message = {
        role: 'system',
        content: `Project loaded: ${project.title || project.brief}. Select an agent from the left sidebar to begin analysis.`,
        timestamp: new Date().toISOString(),
      };
      setConversation([welcomeMessage]);
    }
  };

  // DEPRECATED: Old save function - replaced by autoSaveConversation
  // Kept for reference during migration
  /* const saveCurrentConversation = async (agentType: string) => {
    if (!selectedBrand || !selectedProject) return;

    try {
      await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand_name: selectedBrand.brand_name,
          agent_type: agentType,
          initial_brief: selectedProject.brief,
          messages: [],
        }),
      });

      await loadProjects(selectedBrand.brand_name);
    } catch (error) {
      console.error('Error saving conversation:', error);
    }
  }; */

  // Auto-save conversation after each message
  const autoSaveConversation = async (agentType: string, messages: Message[]) => {
    if (!selectedBrand || !selectedProject || messages.length === 0) return;

    // Support both old and new project brief formats
    const projectBrief = selectedProject.title
      ? `Title: ${selectedProject.title}\nPurpose: ${selectedProject.purpose}\nDeliverable: ${selectedProject.deliverable}${selectedProject.background ? `\nBackground: ${selectedProject.background}` : ''}`
      : selectedProject.brief;

    try {
      await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand_name: selectedBrand.brand_name,
          agent_type: agentType,
          initial_brief: projectBrief,
          messages: messages,
        }),
      });

      // Reload projects silently
      await loadProjects(selectedBrand.brand_name);
    } catch (error) {
      console.error('Error auto-saving conversation:', error);
    }
  };

  // Unified Conversation Handlers for New UI

  // Handle agent selection - shows confirmation prompt in chatbot
  const handleSelectAgent = (agentId: string) => {
    if (!selectedProject) {
      alert('Please select or create a project first');
      return;
    }

    const agent = agents.find(a => a.id === agentId);
    if (!agent) return;

    setSelectedAgent(agentId);

    // Add system message asking for confirmation
    const confirmationMessage: Message = {
      role: 'system',
      content: `You selected: ${agent.name}. Would you like to initiate this agent with the project context? Type your message below or press Enter to start with default prompt.`,
      timestamp: new Date().toISOString(),
      agent: agentId,
    };

    setConversation(prev => [...prev, confirmationMessage]);

    // Auto-populate default prompt based on agent type
    if (agentId === 'orchestrator') {
      setChatInput('Please orchestrate a comprehensive brand strategy analysis using all available agents.');
    } else if (agentId === 'research') {
      setChatInput('Please analyze the current brand status based on the project brief.');
    } else if (agentId === 'customer') {
      setChatInput('Please provide customer insights and audience segmentation for this brand.');
    } else if (agentId === 'competitor') {
      setChatInput('Please analyze the competitive landscape for this brand.');
    } else if (agentId === 'strategy') {
      setChatInput('Please provide strategic recommendations based on available research.');
    }
  };

  // Send message in unified chatbot
  const handleSendUnifiedMessage = async () => {
    if (!chatInput.trim() || !selectedAgent || !selectedProject || !selectedBrand) return;

    const userMessage: Message = {
      role: 'user',
      content: chatInput,
      timestamp: new Date().toISOString(),
      agent: selectedAgent,
    };

    setConversation(prev => [...prev, userMessage]);
    setChatInput('');
    setIsLoading(true);

    try {
      const agent = agents.find(a => a.id === selectedAgent);
      if (!agent) throw new Error('Agent not found');

      // Build context from project brief
      const projectBrief = selectedProject.title
        ? `Title: ${selectedProject.title}\nPurpose: ${selectedProject.purpose}\nDeliverable: ${selectedProject.deliverable}${selectedProject.background ? `\nBackground: ${selectedProject.background}` : ''}`
        : selectedProject.brief;

      const fullContext = `Project Brief:\n${projectBrief}\n\nCurrent question: ${chatInput}`;

      // Determine endpoint based on agent
      let endpoint = `/agents/${selectedAgent}`;
      if (selectedAgent === 'orchestrator') {
        endpoint = '/agents/orchestrate';
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_name: selectedBrand.brand_name,
          brief: fullContext,
          industry: selectedBrand.industry,
          model: selectedModel,
          conversation_history: conversation.filter(m => m.agent === selectedAgent),
          existing_data: {}, // TODO: Gather data from previous agent responses
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

      const assistantMessage: Message = {
        role: 'assistant',
        content: displayContent,
        parsed: parsedContent,
        model: selectedModel,
        timestamp: new Date().toISOString(),
        agent: selectedAgent,
      };

      setConversation(prev => [...prev, assistantMessage]);

      // Auto-save conversation
      await autoSaveConversation(selectedAgent, [...conversation, userMessage, assistantMessage]);

      // Reload brand list to update usage count
      await loadBrands();
    } catch (error: any) {
      const errorMessage: Message = {
        role: 'assistant',
        content: `Error: ${error.message || 'Failed to get response from agent'}`,
        timestamp: new Date().toISOString(),
        agent: selectedAgent,
      };

      setConversation(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle category expansion
  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  // Load brand details and reset state
  const handleBrandSelect = async (brand: any) => {
    try {
      const response = await fetch(`/api/brands/${encodeURIComponent(brand.brand_name)}`);
      const data = await response.json();
      if (data.success) {
        setSelectedBrand(data.brand);
        setIndustry(data.brand.industry || '');

        // Reset state for new brand selection
        setActiveTab('projects');
        setSelectedProject(null);
        setConversation([]);
        setSelectedAgent(null);
        setChatInput('');

        setShowNewBrandForm(false);

        // Load projects for this brand
        await loadProjects(brand.brand_name);
      }
    } catch (error) {
      console.error('Error loading brand details:', error);
      setSelectedBrand(brand);
    }
  };

  const handleCreateBrand = async () => {
    if (!newBrandName || !industry) return;

    try {
      const response = await fetch('/api/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand_name: newBrandName,
          industry,
          brand_info: {},
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

  const handleDeleteBrand = async (brandName: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!confirm(`Are you sure you want to delete "${brandName}" and all its projects? This cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/brands/${encodeURIComponent(brandName)}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        await loadBrands();
        if (selectedBrand?.brand_name === brandName) {
          setSelectedBrand(null);
          setSelectedProject(null);
        }
      }
    } catch (error) {
      console.error('Error deleting brand:', error);
      alert('Failed to delete brand');
    }
  };

  const handleDeleteProject = async (brief: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!confirm('Are you sure you want to delete this project and all its conversations? This cannot be undone.')) {
      return;
    }

    if (!selectedBrand) return;

    try {
      const response = await fetch(
        `/api/brands/${encodeURIComponent(selectedBrand.brand_name)}/projects?brief=${encodeURIComponent(brief)}`,
        {
          method: 'DELETE',
        }
      );

      const data = await response.json();
      if (data.success) {
        await loadProjects(selectedBrand.brand_name);
        if (selectedProject?.brief === brief) {
          setSelectedProject(null);
          setActiveTab('projects');
        }
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('Failed to delete project');
    }
  };

  // DEPRECATED: Old per-agent messaging and toggle functions - replaced by unified handlers
  // Commented out during migration to new UI
  /*
  const sendMessageToAgent = async (agentId: string) => { ... }
  const toggleAgent = (agentId: string) => { ... }
  */

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
            <button
              onClick={handleCreateBrand}
              disabled={!newBrandName || !industry}
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
                <div
                  key={brand.brand_id}
                  className={`
                    relative group p-4 rounded-lg border-2 transition-all cursor-pointer
                    ${selectedBrand?.brand_id === brand.brand_id
                      ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-500 shadow-md'
                      : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 hover:border-primary-300'
                    }
                  `}
                  onClick={() => handleBrandSelect(brand)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white">{brand.brand_name}</h3>
                      {brand.industry && (
                        <p className="text-xs text-slate-600 dark:text-slate-400">{brand.industry}</p>
                      )}
                    </div>
                    <button
                      onClick={(e) => handleDeleteBrand(brand.brand_name, e)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded"
                      title="Delete brand"
                    >
                      <Trash2 size={14} className="text-red-600 dark:text-red-400" />
                    </button>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                    <span>{brand.usage_count || 0} runs</span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {new Date(brand.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Brand Workspace with Tabs */}
      {selectedBrand && (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg overflow-hidden">
          {/* Brand Header */}
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">{selectedBrand.brand_name}</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">{selectedBrand.industry}</p>
              </div>
              <button
                onClick={() => {
                  setSelectedBrand(null);
                  setSelectedProject(null);
                  setActiveTab('projects');
                }}
                className="text-sm text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
              >
                Change Brand
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setActiveTab('projects')}
                className={`pb-2 px-1 border-b-2 transition-colors ${
                  activeTab === 'projects'
                    ? 'border-primary-600 text-primary-600 dark:text-primary-400 font-semibold'
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Projects {projects.length > 0 && `(${projects.length})`}
              </button>
              <button
                onClick={() => selectedProject && setActiveTab('agents')}
                disabled={!selectedProject}
                className={`pb-2 px-1 border-b-2 transition-colors ${
                  activeTab === 'agents' && selectedProject
                    ? 'border-primary-600 text-primary-600 dark:text-primary-400 font-semibold'
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed'
                }`}
              >
                Agents {selectedProject && '→'}
              </button>
            </div>
          </div>

          {/* Projects Tab Content */}
          {activeTab === 'projects' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  {showNewProjectForm ? 'New Project' : 'Your Projects'}
                </h3>
                <button
                  onClick={() => {
                    setShowNewProjectForm(!showNewProjectForm);
                    setNewProjectTitle('');
                    setNewProjectPurpose('');
                    setNewProjectDeliverable('');
                    setNewProjectBackground('');
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors text-sm"
                >
                  <Plus size={16} />
                  {showNewProjectForm ? 'Cancel' : 'New Project'}
                </button>
              </div>

              {/* New Project Form */}
              {showNewProjectForm && (
                <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Project Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newProjectTitle}
                      onChange={(e) => setNewProjectTitle(e.target.value)}
                      placeholder="e.g., Q1 2026 Brand Refresh Campaign"
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Purpose <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={newProjectPurpose}
                      onChange={(e) => setNewProjectPurpose(e.target.value)}
                      placeholder="What is the goal of this project? What problems are you trying to solve?"
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 h-24"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Deliverable <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={newProjectDeliverable}
                      onChange={(e) => setNewProjectDeliverable(e.target.value)}
                      placeholder="What are the expected outcomes? (e.g., Brand positioning statement, 6-month content strategy, competitive analysis report)"
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 h-24"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Background (Optional)
                    </label>
                    <textarea
                      value={newProjectBackground}
                      onChange={(e) => setNewProjectBackground(e.target.value)}
                      placeholder="Any additional context, constraints, or relevant information..."
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 h-24"
                    />
                  </div>

                  <button
                    onClick={handleCreateProject}
                    disabled={!newProjectTitle.trim() || !newProjectPurpose.trim() || !newProjectDeliverable.trim()}
                    className="mt-3 w-full py-2 px-4 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-400 text-white rounded-lg transition-colors"
                  >
                    Create Project & Start Working
                  </button>
                </div>
              )}

              {/* Projects List */}
              {!showNewProjectForm && (
                <>
                  {projects.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                      <p className="mb-2">No projects yet for this brand.</p>
                      <p className="text-sm">Click "New Project" to get started.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {projects.map((project, idx) => {
                        const totalAgents = project.conversations ? new Set(project.conversations.map((c: any) => c.agent_type)).size : 0;

                        return (
                          <div
                            key={idx}
                            className="group p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-primary-500 dark:hover:border-primary-500 transition-colors cursor-pointer"
                            onClick={() => handleSelectProject(project)}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
                                  {project.title || 'Untitled Project'}
                                </h4>
                                <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2 mb-3">
                                  {project.purpose || project.brief || 'No purpose provided'}
                                </p>
                                <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                                  <span>{totalAgents} agent{totalAgents !== 1 ? 's' : ''} used</span>
                                  <span>{project.conversation_count} conversation{project.conversation_count !== 1 ? 's' : ''}</span>
                                  <span className="flex items-center gap-1">
                                    <Clock size={12} />
                                    {new Date(project.last_updated).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={(e) => handleDeleteProject(project.brief, e)}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded"
                                  title="Delete project"
                                >
                                  <Trash2 size={14} className="text-red-600 dark:text-red-400" />
                                </button>
                                <ChevronDown size={18} className="text-slate-400 transform -rotate-90" />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Agents Tab Content - New Split View Layout */}
          {activeTab === 'agents' && selectedProject && (
            <div className="p-6">
              {/* Project Brief Display */}
              <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Current Project:</h3>
                    <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{selectedProject.title || 'Untitled Project'}</h4>
                    {selectedProject.purpose && (
                      <div className="mb-2">
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Purpose: </span>
                        <span className="text-sm text-slate-700 dark:text-slate-300">{selectedProject.purpose}</span>
                      </div>
                    )}
                    {selectedProject.deliverable && (
                      <div className="mb-2">
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Deliverable: </span>
                        <span className="text-sm text-slate-700 dark:text-slate-300">{selectedProject.deliverable}</span>
                      </div>
                    )}
                    {selectedProject.background && (
                      <div>
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Background: </span>
                        <span className="text-sm text-slate-700 dark:text-slate-300">{selectedProject.background}</span>
                      </div>
                    )}
                    {/* Fallback to old brief format */}
                    {!selectedProject.title && selectedProject.brief && (
                      <p className="text-sm text-slate-700 dark:text-slate-300">{selectedProject.brief}</p>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setActiveTab('projects');
                      setSelectedProject(null);
                      setConversation([]);
                      setSelectedAgent(null);
                    }}
                    className="text-sm text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 ml-4"
                  >
                    Change Project
                  </button>
                </div>
              </div>

              {/* Split View: Left Sidebar (Agents) + Right Chatbot */}
              <div className="flex gap-6 h-[calc(100vh-24rem)]">
                {/* Left Sidebar - Agent Categories */}
                <div className="w-80 flex-shrink-0 space-y-4 overflow-y-auto">
                  {agentCategories.map((category) => (
                    <div key={category.id} className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                      {/* Category Header */}
                      <button
                        onClick={() => toggleCategory(category.id)}
                        className="w-full p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                      >
                        <div className="text-left">
                          <h3 className="font-semibold text-slate-900 dark:text-white text-sm">{category.name}</h3>
                          <p className="text-xs text-slate-600 dark:text-slate-400">{category.description}</p>
                        </div>
                        {expandedCategories[category.id] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>

                      {/* Agent List */}
                      {expandedCategories[category.id] && category.agents.length > 0 && (
                        <div className="border-t border-slate-200 dark:border-slate-700">
                          {category.agents.map((agent) => {
                            const Icon = agent.icon;
                            const colors = colorClasses[agent.color];
                            const isSelected = selectedAgent === agent.id;

                            return (
                              <button
                                key={agent.id}
                                onClick={() => handleSelectAgent(agent.id)}
                                className={`w-full p-3 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors border-b border-slate-100 dark:border-slate-700 last:border-b-0 ${
                                  isSelected ? 'bg-slate-100 dark:bg-slate-700' : ''
                                }`}
                              >
                                <div className={`p-2 rounded-lg ${colors.bg} flex-shrink-0`}>
                                  <Icon className={colors.icon} size={16} />
                                </div>
                                <div className="flex-1 text-left">
                                  <h4 className="text-sm font-medium text-slate-900 dark:text-white">{agent.name}</h4>
                                  <div className="mt-1 flex flex-wrap gap-1">
                                    {agent.capabilities.slice(0, 2).map((cap, idx) => (
                                      <span key={idx} className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-600 dark:text-slate-400">
                                        {cap}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Right Side - Unified Chatbot */}
                <div className="flex-1 flex flex-col bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                  {/* Chat Header */}
                  <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white">Project Conversation</h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {selectedAgent
                          ? `Active: ${agents.find(a => a.id === selectedAgent)?.name}`
                          : 'Select an agent from the left to start'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        className="px-3 py-1 text-xs border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                      >
                        {models.map((model) => (
                          <option key={model.id} value={model.id}>
                            {model.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Chat Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {conversation.length === 0 ? (
                      <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                        <Sparkles size={48} className="mx-auto mb-4 opacity-20" />
                        <p className="mb-2">Welcome to your project workspace!</p>
                        <p className="text-sm">Select an agent from the left sidebar to begin analysis.</p>
                      </div>
                    ) : (
                      conversation.map((msg, idx) => (
                        <div
                          key={idx}
                          className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          {msg.role === 'assistant' && (
                            <div className={`p-2 rounded-full ${
                              msg.agent ? colorClasses[agents.find(a => a.id === msg.agent)?.color || 'purple'].bg : 'bg-slate-100 dark:bg-slate-700'
                            } flex-shrink-0 self-start`}>
                              <Bot className={
                                msg.agent ? colorClasses[agents.find(a => a.id === msg.agent)?.color || 'purple'].icon : 'text-slate-600'
                              } size={16} />
                            </div>
                          )}
                          {msg.role === 'system' && (
                            <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/20 flex-shrink-0 self-start">
                              <Sparkles className="text-blue-600 dark:text-blue-400" size={16} />
                            </div>
                          )}
                          <div
                            className={`max-w-[80%] rounded-lg p-3 ${
                              msg.role === 'user'
                                ? 'bg-primary-600 text-white'
                                : msg.role === 'system'
                                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100'
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white'
                            }`}
                          >
                            {msg.parsed ? (
                              <RenderJSON data={msg.parsed} />
                            ) : (
                              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                            )}
                            {msg.model && msg.role === 'assistant' && (
                              <p className="text-xs mt-2 opacity-70">
                                {models.find(m => m.id === msg.model)?.name || msg.model}
                              </p>
                            )}
                          </div>
                          {msg.role === 'user' && (
                            <div className="p-2 rounded-full bg-primary-100 dark:bg-primary-900/20 flex-shrink-0 self-start">
                              <User className="text-primary-600 dark:text-primary-400" size={16} />
                            </div>
                          )}
                        </div>
                      ))
                    )}
                    {isLoading && (
                      <div className="flex gap-3">
                        <div className="p-2 rounded-full bg-slate-100 dark:bg-slate-700 flex-shrink-0">
                          <Loader2 className="text-slate-600 dark:text-slate-400 animate-spin" size={16} />
                        </div>
                        <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-3">
                          <p className="text-sm text-slate-600 dark:text-slate-400">Thinking...</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Chat Input */}
                  <div className="p-4 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSendUnifiedMessage()}
                        placeholder={selectedAgent ? "Type your message..." : "Select an agent first..."}
                        disabled={!selectedAgent || isLoading}
                        className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:cursor-not-allowed"
                      />
                      <button
                        onClick={handleSendUnifiedMessage}
                        disabled={!chatInput.trim() || !selectedAgent || isLoading}
                        className="px-4 py-2 rounded-lg text-white font-medium transition-colors bg-primary-600 hover:bg-primary-700 disabled:bg-slate-400 disabled:cursor-not-allowed"
                      >
                        <Send size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
