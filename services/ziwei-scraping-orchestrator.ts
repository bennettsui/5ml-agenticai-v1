/**
 * Ziwei Scraping Orchestrator Service
 * Manages the knowledge extraction and continuous improvement workflow
 *
 * Responsibilities:
 * - Schedule and prioritize scraping tasks
 * - Coordinate Search, Validation, Devil's Advocate, and Integration agents
 * - Manage token budgets and costs
 * - Track progress and confidence scores
 * - Generate reports and metrics
 */

import type { ZiweiRule } from './ziwei-rule-evaluator';

export interface ScrapingSource {
  id: string;
  name: string;
  url: string;
  priority: number; // 1-3
  authority: 'tier1' | 'tier2' | 'tier3';
  targetData: string[];
  estimatedTokens: number;
  status: 'pending' | 'scraping' | 'completed' | 'failed';
  progress: number;
  itemsFound: number;
  lastRun?: Date;
  nextRun?: Date;
}

export interface KnowledgeGap {
  id: string;
  category: string;
  description: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  coverage: number; // 0-100%
  itemsNeeded: number;
  itemsComplete: number;
  priority: number;
  estimatedTokens: number;
  relatedSources: string[];
  targetPhase: 1 | 2 | 3 | 4;
}

export interface ScrapingPhase {
  phaseNumber: 1 | 2 | 3 | 4;
  name: string;
  description: string;
  targetData: string[];
  sources: ScrapingSource[];
  estimatedTokens: number;
  estimatedDuration: string;
  targetConfidence: number;
  status: 'pending' | 'in_progress' | 'completed' | 'paused';
  progress: number;
  startDate?: Date;
  endDate?: Date;
}

export interface ScrapedItem {
  id: string;
  sourceId: string;
  itemType: 'star' | 'palace_meaning' | 'transformation' | 'luck_cycle' | 'pattern';
  content: any;
  rawContent: string;
  confidence: number;
  devilsAdvocateNotes?: string;
  status: 'scraped' | 'validated' | 'critiqued' | 'integrated' | 'rejected';
  scrapedAt: Date;
  validatedAt?: Date;
  integratedAt?: Date;
}

export interface BudgetAllocation {
  daily: number;
  weekly: number;
  monthly: number;
  maxCarryOver: number;
  currentRemaining: number;
}

export interface ScrapingMetrics {
  totalTokensUsed: number;
  totalTokensBudgeted: number;
  itemsScraped: number;
  itemsValidated: number;
  itemsIntegrated: number;
  averageConfidence: number;
  phaseProgress: Record<number, number>;
  costPerItem: number;
  estimatedCompletionDate: Date;
  coverage: {
    stars: number;
    palaces: number;
    transformations: number;
    patterns: number;
    overallPercentage: number;
  };
}

// ============================================================================
// ORCHESTRATOR CLASS
// ============================================================================

export class ZiweiScrapingOrchestrator {
  private phases: ScrapingPhase[] = [];
  private gaps: KnowledgeGap[] = [];
  private sources: ScrapingSource[] = [];
  private scrapedItems: ScrapedItem[] = [];
  private budget: BudgetAllocation;
  private metrics: ScrapingMetrics;
  private activePhase: number = 0;

  constructor(budget: BudgetAllocation) {
    this.budget = budget;
    this.metrics = {
      totalTokensUsed: 0,
      totalTokensBudgeted: budget.daily + budget.weekly + budget.monthly,
      itemsScraped: 0,
      itemsValidated: 0,
      itemsIntegrated: 0,
      averageConfidence: 0,
      phaseProgress: { 1: 0, 2: 0, 3: 0, 4: 0 },
      costPerItem: 0,
      estimatedCompletionDate: new Date(Date.now() + 9 * 7 * 24 * 60 * 60 * 1000),
      coverage: {
        stars: 14,
        palaces: 12,
        transformations: 0,
        patterns: 25,
        overallPercentage: 15
      }
    };
  }

  /**
   * Initialize with sources and gaps from database
   */
  async initialize(sources: ScrapingSource[], gaps: KnowledgeGap[]): Promise<void> {
    this.sources = sources;
    this.gaps = gaps;
    this.setupPhases();
  }

  /**
   * Setup scraping phases based on priorities
   */
  private setupPhases(): void {
    this.phases = [
      {
        phaseNumber: 1,
        name: 'Critical Foundation',
        description: 'Primary sources (王亭之, Official institutes)',
        targetData: [
          '104 stars with base meanings',
          '12 palaces overview',
          '王亭之 primary teachings',
          'Transformation theory foundation',
          'Flying stars basic rules'
        ],
        sources: this.sources.filter(s => s.priority === 1),
        estimatedTokens: 50000,
        estimatedDuration: '2 weeks',
        targetConfidence: 0.85,
        status: 'pending',
        progress: 0
      },
      {
        phaseNumber: 2,
        name: 'Specialized Knowledge',
        description: 'Luck cycles & transformations',
        targetData: [
          'Decade Luck (大運)',
          'Annual Luck (流年)',
          'Monthly Luck (流月)',
          'Four Transformations (四化)'
        ],
        sources: this.sources.filter(s => s.priority === 2),
        estimatedTokens: 20000,
        estimatedDuration: '2 weeks',
        targetConfidence: 0.82,
        status: 'pending',
        progress: 0
      },
      {
        phaseNumber: 3,
        name: 'Comprehensive Dictionary',
        description: 'All 1,248 star-palace combinations',
        targetData: [
          '104 stars × 12 palaces = 1,248 combinations',
          'Career/wealth/relationship impacts',
          'Star interaction rules'
        ],
        sources: this.sources.filter(s => s.priority === 2),
        estimatedTokens: 30000,
        estimatedDuration: '3 weeks',
        targetConfidence: 0.80,
        status: 'pending',
        progress: 0
      },
      {
        phaseNumber: 4,
        name: 'Verification & Completeness',
        description: 'Cross-validation & accuracy metrics',
        targetData: [
          'Cross-source validation',
          'Conflict resolution',
          'Accuracy metrics',
          'Gap identification'
        ],
        sources: this.sources.filter(s => s.priority === 3),
        estimatedTokens: 15000,
        estimatedDuration: '2+ weeks',
        targetConfidence: 0.88,
        status: 'pending',
        progress: 0
      }
    ];
  }

  /**
   * Start next phase of scraping
   */
  async startPhase(phaseNumber: number): Promise<void> {
    const phase = this.phases[phaseNumber - 1];
    if (!phase) throw new Error(`Phase ${phaseNumber} not found`);

    phase.status = 'in_progress';
    phase.startDate = new Date();
    this.activePhase = phaseNumber;

    console.log(`🚀 Starting Phase ${phaseNumber}: ${phase.name}`);

    // Queue sources for scraping
    for (const source of phase.sources) {
      await this.scheduleSourceScraping(source, phaseNumber);
    }
  }

  /**
   * Schedule a source for scraping with cost/benefit analysis
   */
  private async scheduleSourceScraping(source: ScrapingSource, phase: number): Promise<void> {
    // Check if we have budget
    if (this.budget.currentRemaining < source.estimatedTokens) {
      console.warn(
        `⚠️ Insufficient budget for ${source.name}. ` +
        `Remaining: ${this.budget.currentRemaining}, Needed: ${source.estimatedTokens}`
      );
      return;
    }

    // Calculate priority score
    const priorityScore = this.calculatePriorityScore(source);

    console.log(
      `📋 Queuing ${source.name} (priority: ${priorityScore}, cost: ${source.estimatedTokens}K tokens)`
    );

    source.status = 'scraping';
    source.progress = 0;

    // Simulate scraping with progress updates
    await this.performScraping(source);
  }

  /**
   * Calculate priority score for source scheduling
   */
  private calculatePriorityScore(source: ScrapingSource): number {
    // Priority = (authority weight × relevance weight) / (cost weight)
    const authorityScore = source.authority === 'tier1' ? 3 : source.authority === 'tier2' ? 2 : 1;
    const relevanceGaps = this.gaps.filter(g =>
      g.relatedSources.includes(source.id) && g.coverage < 100
    ).length;
    const costWeight = source.estimatedTokens / 10000;

    return (authorityScore * (relevanceGaps + 1)) / costWeight;
  }

  /**
   * Perform scraping with simulated progress updates
   */
  private async performScraping(source: ScrapingSource): Promise<void> {
    const interval = setInterval(() => {
      if (source.progress < 100) {
        source.progress += Math.random() * 15;
        if (source.progress > 100) source.progress = 100;
      } else {
        clearInterval(interval);
        this.completeScraping(source);
      }
    }, 2000);
  }

  /**
   * Complete scraping for a source
   */
  private async completeScraping(source: ScrapingSource): Promise<void> {
    source.status = 'completed';
    source.lastRun = new Date();
    source.nextRun = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    // Deduct from budget
    this.budget.currentRemaining -= source.estimatedTokens;
    this.metrics.totalTokensUsed += source.estimatedTokens;

    console.log(`✅ Completed scraping for ${source.name}`);

    // Queue for validation
    await this.queueForValidation(source);
  }

  /**
   * Queue scraped items for validation
   */
  private async queueForValidation(source: ScrapingSource): Promise<void> {
    console.log(`📊 Queuing ${source.itemsFound} items from ${source.name} for validation`);
    this.metrics.itemsScraped += source.itemsFound;
  }

  /**
   * Validate items using multi-source comparison
   */
  async validateItems(items: ScrapedItem[]): Promise<ScrapedItem[]> {
    console.log(`🔍 Validating ${items.length} items...`);

    const validated = items.map(item => ({
      ...item,
      confidence: this.calculateConfidence(item),
      status: 'validated' as const,
      validatedAt: new Date()
    }));

    this.metrics.itemsValidated += validated.length;
    return validated;
  }

  /**
   * Calculate confidence score for a scraped item
   */
  private calculateConfidence(item: ScrapedItem): number {
    // Base on source authority
    const source = this.sources.find(s => s.id === item.sourceId);
    if (!source) return 0.5;

    let confidence = source.authority === 'tier1' ? 0.85 : source.authority === 'tier2' ? 0.75 : 0.65;

    // Adjust based on cross-source validation
    const crossValidation = this.findCrossValidation(item);
    if (crossValidation.count >= 3) {
      confidence = Math.min(0.95, confidence + 0.1);
    } else if (crossValidation.count >= 2) {
      confidence = Math.min(0.92, confidence + 0.05);
    } else if (crossValidation.conflicts) {
      confidence = Math.max(0.5, confidence - 0.15);
    }

    return confidence;
  }

  /**
   * Find cross-validation data for an item
   */
  private findCrossValidation(item: ScrapedItem): { count: number; conflicts: boolean } {
    // In real implementation, would query other sources
    return { count: 2, conflicts: false };
  }

  /**
   * Devil's Advocate critique process
   */
  async critiquItems(items: ScrapedItem[]): Promise<ScrapedItem[]> {
    console.log(`🤔 Devil's Advocate reviewing ${items.length} items...`);

    const critiqued = items.map(item => {
      if (item.confidence < 0.7 || this.hasConflicts(item)) {
        const notes = this.generateCritique(item);
        return {
          ...item,
          devilsAdvocateNotes: notes,
          confidence: Math.max(0.5, item.confidence - 0.05),
          status: 'critiqued' as const
        };
      }
      return {
        ...item,
        status: 'critiqued' as const
      };
    });

    return critiqued;
  }

  /**
   * Check if item has conflicts with existing data
   */
  private hasConflicts(item: ScrapedItem): boolean {
    // In real implementation, would check against database
    return false;
  }

  /**
   * Generate Devil's Advocate critique
   */
  private generateCritique(item: ScrapedItem): string {
    const critiques = [
      '⚠️ Single source - needs cross-validation',
      '⚠️ No empirical basis documented',
      '⚠️ Historical context unclear',
      '⚠️ May conflict with established rules',
      '⚠️ Needs Wang Ting Zhi source verification'
    ];
    return critiques[Math.floor(Math.random() * critiques.length)];
  }

  /**
   * Integrate validated items into knowledge base
   */
  async integrateItems(items: ScrapedItem[]): Promise<number> {
    const integrated = items.filter(
      item => item.confidence >= 0.75 && item.status === 'critiqued'
    );

    console.log(`💾 Integrating ${integrated.length}/${items.length} items`);

    this.metrics.itemsIntegrated += integrated.length;
    this.updateCoverageMetrics();

    return integrated.length;
  }

  /**
   * Update coverage metrics
   */
  private updateCoverageMetrics(): void {
    const total = this.gaps.length;
    const complete = this.gaps.filter(g => g.coverage === 100).length;

    this.metrics.coverage.overallPercentage = Math.round((complete / total) * 100);
    this.metrics.averageConfidence =
      this.metrics.itemsIntegrated > 0
        ? this.scrapedItems
          .filter(i => i.status === 'integrated')
          .reduce((sum, i) => sum + i.confidence, 0) / this.metrics.itemsIntegrated
        : 0;
    this.metrics.costPerItem = this.metrics.totalTokensUsed / Math.max(this.metrics.itemsIntegrated, 1);
  }

  /**
   * Get current metrics
   */
  getMetrics(): ScrapingMetrics {
    return this.metrics;
  }

  /**
   * Get phase status
   */
  getPhaseStatus(phaseNumber: number): ScrapingPhase | null {
    return this.phases[phaseNumber - 1] || null;
  }

  /**
   * Get all phases
   */
  getAllPhases(): ScrapingPhase[] {
    return this.phases;
  }

  /**
   * Pause all scraping
   */
  pauseAllScraping(): void {
    this.phases.forEach(phase => {
      if (phase.status === 'in_progress') {
        phase.status = 'paused';
      }
    });
    console.log('⏸️ All scraping paused');
  }

  /**
   * Resume scraping
   */
  resumeScraping(phaseNumber?: number): void {
    if (phaseNumber) {
      const phase = this.phases[phaseNumber - 1];
      if (phase) phase.status = 'in_progress';
    } else {
      this.phases.forEach(phase => {
        if (phase.status === 'paused') {
          phase.status = 'in_progress';
        }
      });
    }
    console.log('▶️ Scraping resumed');
  }

  /**
   * Generate comprehensive report
   */
  generateReport(): string {
    const report = `
═══════════════════════════════════════════════════════════════
ZIWEI KNOWLEDGE SCRAPING REPORT
═══════════════════════════════════════════════════════════════

📊 OVERALL METRICS
- Knowledge Coverage: ${this.metrics.coverage.overallPercentage}%
- Items Scraped: ${this.metrics.itemsScraped}
- Items Validated: ${this.metrics.itemsValidated}
- Items Integrated: ${this.metrics.itemsIntegrated}
- Average Confidence: ${(this.metrics.averageConfidence * 100).toFixed(1)}%
- Cost per Item: ${this.metrics.costPerItem.toFixed(1)}K tokens

💰 BUDGET STATUS
- Total Budgeted: ${this.metrics.totalTokensBudgeted}K tokens
- Total Used: ${this.metrics.totalTokensUsed}K tokens
- Remaining: ${this.budget.currentRemaining}K tokens

🎯 PHASE PROGRESS
${this.phases
  .map(
    phase => `- Phase ${phase.phaseNumber}: ${phase.name} - ${phase.progress}% complete (${phase.status})`
  )
  .join('\n')}

📅 ESTIMATED COMPLETION
- Target: ${this.metrics.estimatedCompletionDate.toDateString()}
- Days Remaining: ${Math.ceil((this.metrics.estimatedCompletionDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000))}

✅ COMPLETION TARGETS
- Stars: ${this.metrics.coverage.stars}/104 (${Math.round((this.metrics.coverage.stars / 104) * 100)}%)
- Palaces: ${this.metrics.coverage.palaces}/12 (100%)
- Transformations: ${this.metrics.coverage.transformations}/40 (${Math.round((this.metrics.coverage.transformations / 40) * 100)}%)
- Patterns: ${this.metrics.coverage.patterns}/100+ (${Math.round((this.metrics.coverage.patterns / 100) * 100)}%)

═══════════════════════════════════════════════════════════════
    `;
    return report;
  }
}

export default ZiweiScrapingOrchestrator;
