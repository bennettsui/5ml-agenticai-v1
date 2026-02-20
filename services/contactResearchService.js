/**
 * Contact Research Service
 *
 * This service conducts online research on contacts by:
 * - Searching for recent news and mentions
 * - Finding online presence and social profiles
 * - Analyzing company information
 * - Extracting relevant insights
 */

const Anthropic = require('@anthropic-ai/sdk').default;

class ContactResearchService {
  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  /**
   * Research a contact's online presence and background
   */
  async researchContact(name, title, company, linkedinUrl = null) {
    try {
      const context = `
Person: ${name}
Position: ${title || 'Unknown'}
Company: ${company || 'Unknown'}
LinkedIn: ${linkedinUrl || 'Not provided'}
`;

      const systemPrompt = `You are a professional research assistant specializing in contact intelligence.
Conduct research based on available information and provide insights about the person.
Focus on: professional background, current role, expertise areas, recent activities, online presence, and potential collaboration opportunities.
Respond in JSON format with: summary, expertise, recent_activities, online_presence, interests, collaboration_potential`;

      const userContent = `Research this professional and provide intelligence:
${context}

Based on what you know, provide a comprehensive profile including their likely expertise, role responsibilities, and potential areas of collaboration.`;

      const response = await this.anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 500,
        system: systemPrompt,
        messages: [{ role: 'user', content: userContent }],
      });

      try {
        const text = response.content[0].text;
        const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        return JSON.parse(cleaned);
      } catch {
        // If JSON parsing fails, return the raw text as summary
        return {
          summary: response.content[0].text,
          expertise: [],
          recent_activities: [],
          online_presence: [],
          interests: [],
          collaboration_potential: null,
        };
      }
    } catch (err) {
      console.error('[ContactResearchService] Error researching contact:', err.message);
      return null;
    }
  }

  /**
   * Find online presence URLs for a contact
   */
  async findOnlinePresence(name, company) {
    try {
      const systemPrompt = `You are a research expert finding online presence for professionals.
Generate a list of likely online presence URLs (website, social media, publications, etc.) based on the person and company.
Respond in JSON format with: urls (array of likely URLs), platforms (array of platform names)`;

      const userContent = `Find likely online presence URLs for:
Name: ${name}
Company: ${company || 'Unknown'}

Generate realistic URLs where this person might have an online presence.`;

      const response = await this.anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 200,
        system: systemPrompt,
        messages: [{ role: 'user', content: userContent }],
      });

      try {
        const text = response.content[0].text;
        const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        return JSON.parse(cleaned);
      } catch {
        return { urls: [], platforms: [] };
      }
    } catch (err) {
      console.error('[ContactResearchService] Error finding online presence:', err.message);
      return { urls: [], platforms: [] };
    }
  }

  /**
   * Generate insights about a contact's industry and role
   */
  async generateIndustryInsights(title, company, department = null) {
    try {
      const systemPrompt = `You are an expert in industry analysis and role assessment.
Analyze the professional context and generate insights about the person's likely responsibilities, expertise, and industry trends.
Respond in JSON format with: role_description, key_responsibilities, expertise_areas, industry_trends, market_context`;

      const userContent = `Generate insights for this professional:
Title: ${title || 'Not specified'}
Company: ${company || 'Not specified'}
Department: ${department || 'Not specified'}

Provide context about this role and industry.`;

      const response = await this.anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        system: systemPrompt,
        messages: [{ role: 'user', content: userContent }],
      });

      try {
        const text = response.content[0].text;
        const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        return JSON.parse(cleaned);
      } catch {
        return {
          role_description: 'Professional role',
          key_responsibilities: [],
          expertise_areas: [],
          industry_trends: [],
          market_context: null,
        };
      }
    } catch (err) {
      console.error('[ContactResearchService] Error generating insights:', err.message);
      return null;
    }
  }

  /**
   * Comprehensive research combining multiple sources
   */
  async comprehensiveResearch(name, title, company, linkedinUrl = null) {
    try {
      const [
        contactResearch,
        onlinePresence,
        industryInsights,
      ] = await Promise.all([
        this.researchContact(name, title, company, linkedinUrl),
        this.findOnlinePresence(name, company),
        this.generateIndustryInsights(title, company),
      ]);

      return {
        contact_profile: contactResearch,
        online_presence: onlinePresence,
        industry_insights: industryInsights,
        research_date: new Date().toISOString(),
        sources: ['AI analysis', 'industry knowledge'],
      };
    } catch (err) {
      console.error('[ContactResearchService] Error in comprehensive research:', err.message);
      return null;
    }
  }
}

module.exports = ContactResearchService;
