/**
 * LinkedIn Profile Fetcher
 *
 * This service fetches LinkedIn profile data for contacts.
 * In production, this would integrate with LinkedIn API or a scraping service.
 * For now, it's a mock implementation that can be enhanced later.
 */

const Anthropic = require('@anthropic-ai/sdk').default;

class LinkedInProfileFetcher {
  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  /**
   * Fetch and parse LinkedIn profile data from a URL
   * This is a mock implementation - in production, integrate with:
   * - LinkedIn API (requires special access)
   * - Third-party LinkedIn scraping service
   * - Claude's web capabilities if available
   */
  async fetchProfile(linkedinUrl) {
    try {
      if (!linkedinUrl) {
        return {};
      }

      // For now, extract basic info from URL
      // Pattern: https://linkedin.com/in/firstname-lastname
      const match = linkedinUrl.match(/\/in\/([^/?]+)/);
      if (!match) {
        return {};
      }

      const slug = match[1];
      const nameParts = slug.split('-').map(part =>
        part.charAt(0).toUpperCase() + part.slice(1)
      );

      // Mock profile data
      return {
        slug,
        name: nameParts.join(' '),
        headline: 'Professional in technology industry',
        about: 'Focused on innovation and leadership',
        followers: null,
        experience: [],
        education: [],
        skills: [],
        endorsements: {},
        lastUpdated: new Date().toISOString(),
      };
    } catch (err) {
      console.error('[LinkedInProfileFetcher] Error fetching profile:', err.message);
      return {};
    }
  }

  /**
   * Extract key insights from a LinkedIn profile
   */
  async analyzeProfile(linkedinData) {
    try {
      if (!linkedinData || Object.keys(linkedinData).length === 0) {
        return null;
      }

      const systemPrompt = `You are an AI assistant analyzing LinkedIn profiles.
Extract key insights about the person's background, expertise, and potential collaboration areas.
Respond in JSON format with: career_stage, expertise, interests, potential_value`;

      const userContent = `Analyze this LinkedIn profile data:
${JSON.stringify(linkedinData, null, 2)}

Provide concise insights.`;

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
        return { insights: response.content[0].text };
      }
    } catch (err) {
      console.error('[LinkedInProfileFetcher] Error analyzing profile:', err.message);
      return null;
    }
  }

  /**
   * Get LinkedIn profile summary for a contact
   */
  async getProfileSummary(linkedinUrl) {
    try {
      const profile = await this.fetchProfile(linkedinUrl);
      const insights = await this.analyzeProfile(profile);
      return {
        profile,
        insights,
        fetchedAt: new Date().toISOString(),
      };
    } catch (err) {
      console.error('[LinkedInProfileFetcher] Error getting summary:', err.message);
      return null;
    }
  }
}

module.exports = LinkedInProfileFetcher;
