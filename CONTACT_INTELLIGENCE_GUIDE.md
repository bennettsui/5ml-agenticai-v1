# Contact Intelligence Module - Implementation Guide

**Status**: ✅ Completed and Pushed to Remote

## Overview

The Contact Intelligence Module enables the CRM to manage contacts (people/stakeholders) with sophisticated LinkedIn profile integration and AI-powered online research capabilities. This module is designed for agency-based operations where contacts are tied to specific projects and clients/brands.

## Architecture

### Relationship Model

```
Brand/Client (crm_clients)
    ↓
    ├─→ Project (crm_projects)
    │    └─→ Contact (via crm_contact_project_links)
    │
    └─→ Contact (crm_contacts)
         ├─ LinkedIn Profile Data
         ├─ Online Research Data
         └─ Project Links
```

**Key Principle**: Contacts are primarily linked to projects, with secondary links to brands. This reflects agency workflows where people work on specific projects, not generic brand relationships.

## Database Schema

### crm_contacts Table

```sql
CREATE TABLE crm_contacts (
  id UUID PRIMARY KEY,
  client_id UUID REFERENCES crm_clients(id),  -- Brand/Company
  name VARCHAR(300) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  title VARCHAR(200),                          -- Job title
  department VARCHAR(100),
  linkedin_url VARCHAR(500),
  linkedin_data JSONB,                         -- Cached LinkedIn profile
  research_data JSONB,                         -- AI research findings
  notes TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

### crm_contact_project_links Table

```sql
CREATE TABLE crm_contact_project_links (
  id UUID PRIMARY KEY,
  contact_id UUID REFERENCES crm_contacts(id),
  project_id UUID REFERENCES crm_projects(id),
  role VARCHAR(100),                           -- e.g., "Stakeholder", "Decision Maker"
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

## Frontend Pages

### 1. Contacts List (`/use-cases/crm/contacts`)

**Purpose**: View all contacts for a selected brand

**Features**:
- Brand/client dropdown selector
- Contact cards with:
  - Name, title, department
  - Email, phone, LinkedIn links
  - Delete button
- "New Contact" button
- Empty state handling

**URL Pattern**: `/use-cases/crm/contacts?brandId=<id>`

### 2. New Contact (`/use-cases/crm/contacts/new`)

**Purpose**: Create a new contact

**Features**:
- Form fields:
  - Full Name (required)
  - Email
  - Phone
  - Job Title
  - Department
  - LinkedIn URL
  - Notes
- "Fetch LinkedIn Profile" button to auto-populate data
- Cancel/Create actions
- Form validation

**URL Pattern**: `/use-cases/crm/contacts/new?clientId=<id>`

### 3. Contact Detail (`/use-cases/crm/contacts/detail`)

**Purpose**: View and edit contact information

**Features**:
- View mode:
  - Display all contact fields
  - Show cached LinkedIn profile data
  - Show AI research findings
- Edit mode:
  - Inline editing of all fields
  - Save/cancel actions
- LinkedIn Profile section:
  - Headline, about, experience, education
  - Skills and endorsements
- Research Intelligence section:
  - Summary of online research
  - Online presence links
  - Recent news and mentions
  - Industry insights

**URL Pattern**: `/use-cases/crm/contacts/detail?id=<contactId>`

## API Endpoints

### Contact Management

```
POST   /api/crm/contacts/:clientId
       Create a new contact
       Body: { name, email, phone, title, department, linkedin_url, notes }
       Returns: { success: true, contact: {...} }

GET    /api/crm/contacts/:clientId
       List all contacts for a client
       Returns: { contacts: [...] }

GET    /api/crm/contacts/:clientId/:contactId
       Get contact details
       Returns: { id, name, email, ... linkedin_data, research_data }

PUT    /api/crm/contacts/:clientId/:contactId
       Update contact information
       Body: { name?, email?, phone?, title?, department?, linkedin_url?, notes?, linkedin_data?, research_data? }
       Returns: { success: true, contact: {...} }

DELETE /api/crm/contacts/:clientId/:contactId
       Delete a contact
       Returns: { success: true }
```

### Project-Contact Linking

```
POST   /api/crm/contacts/:contactId/link-project
       Link contact to a project
       Body: { projectId, role }
       Returns: { success: true, link: {...} }

GET    /api/crm/projects/:projectId/contacts
       Get all contacts for a project
       Returns: { contacts: [...] }

DELETE /api/crm/contacts/:contactId/unlink-project/:projectId
       Unlink contact from project
       Returns: { success: true }
```

### Intelligence & Research

```
POST   /api/linkedin/profile
       Fetch LinkedIn profile data
       Body: { url }
       Returns: { success: true, data: { profile, insights, fetchedAt } }

POST   /api/contacts/:contactId/research
       Conduct comprehensive online research
       Body: { name, title, company, linkedinUrl }
       Returns: { success: true, research: { contact_profile, online_presence, industry_insights, ... } }
```

## Services

### LinkedInProfileFetcher (`services/linkedinProfileFetcher.js`)

**Methods**:

```javascript
// Fetch and analyze LinkedIn profile
await fetcher.fetchProfile(linkedinUrl)
// Returns: { slug, name, headline, about, followers, experience, education, skills, endorsements }

// Get profile summary with insights
await fetcher.getProfileSummary(linkedinUrl)
// Returns: { profile, insights, fetchedAt }

// Analyze profile for key insights
await fetcher.analyzeProfile(linkedinData)
// Returns: { career_stage, expertise, interests, potential_value }
```

**Current Implementation**: Mock (generates realistic data from URL slug)
**Production Integration**: Ready for LinkedIn API or third-party scraping service

### ContactResearchService (`services/contactResearchService.js`)

**Methods**:

```javascript
// Research a contact's online presence
await research.researchContact(name, title, company, linkedinUrl)
// Returns: { summary, expertise, recent_activities, online_presence, interests, collaboration_potential }

// Find likely online presence URLs
await research.findOnlinePresence(name, company)
// Returns: { urls, platforms }

// Generate industry and role insights
await research.generateIndustryInsights(title, company, department)
// Returns: { role_description, key_responsibilities, expertise_areas, industry_trends, market_context }

// Comprehensive research combining all sources
await research.comprehensiveResearch(name, title, company, linkedinUrl)
// Returns: { contact_profile, online_presence, industry_insights, research_date, sources }
```

**Intelligence Sources**:
- LinkedIn profile analysis
- AI-powered background research
- Industry knowledge synthesis
- Online presence discovery
- Expertise area identification

## Usage Workflows

### Adding a New Contact

1. Navigate to `/use-cases/crm/contacts`
2. Select a brand/client from dropdown
3. Click "New Contact"
4. Enter contact information:
   - Name (required)
   - Email, phone, job title, department
   - LinkedIn URL (optional)
5. Click "Fetch LinkedIn Profile" to auto-populate from LinkedIn
6. Add notes if needed
7. Click "Create Contact"

### Linking Contact to a Project

1. View contact details
2. Use project linking API or UI to associate with projects
3. Specify contact's role (e.g., "Stakeholder", "Decision Maker", "Project Lead")
4. Contact now appears in project's contacts list

### Conducting Research on a Contact

1. Click "Research" on contact detail page
2. System conducts:
   - LinkedIn profile analysis
   - Online presence discovery
   - Industry research
   - AI-powered intelligence synthesis
3. Results stored in `research_data` field
4. Displayed in "Online Research" section on contact page

## Data Model - LinkedIn Profile

```json
{
  "slug": "john-doe",
  "name": "John Doe",
  "headline": "Marketing Director at TechCorp",
  "about": "Experienced marketing leader...",
  "followers": 1200,
  "experience": [
    {
      "title": "Marketing Director",
      "company": "TechCorp",
      "duration": "2020-present"
    }
  ],
  "education": [
    {
      "school": "University of Tech",
      "degree": "MBA",
      "field": "Business Administration"
    }
  ],
  "skills": ["Marketing", "Leadership", "Strategic Planning"],
  "endorsements": {
    "Marketing": 45,
    "Leadership": 32
  }
}
```

## Data Model - Research Intelligence

```json
{
  "contact_profile": {
    "summary": "Marketing leader with 10+ years experience...",
    "expertise": ["Digital Marketing", "B2B Strategy", "Team Leadership"],
    "recent_activities": ["Spoke at TechConf 2024", "Published article on marketing trends"],
    "online_presence": ["LinkedIn", "Medium blog", "Twitter @johndoe"],
    "interests": ["Growth marketing", "AI applications"],
    "collaboration_potential": "High - experience aligns with platform needs"
  },
  "online_presence": {
    "urls": [
      "https://linkedin.com/in/john-doe",
      "https://johndoe.medium.com",
      "https://twitter.com/johndoe"
    ],
    "platforms": ["LinkedIn", "Medium", "Twitter", "Personal Blog"]
  },
  "industry_insights": {
    "role_description": "Strategic marketing leadership role",
    "key_responsibilities": ["Team management", "Strategy development", "Campaign oversight"],
    "expertise_areas": ["Digital marketing", "B2B SaaS", "Growth"],
    "industry_trends": ["AI in marketing", "First-party data strategies", "Content personalization"],
    "market_context": "Growing demand for marketing leaders with AI expertise"
  },
  "research_date": "2026-02-20T15:30:00Z",
  "sources": ["AI analysis", "industry knowledge"]
}
```

## Integration Points

### With Brand/Client Module
- Contacts linked to brands via `client_id`
- Brand context used for research and insights
- Brand guidelines inform compliance checking

### With Projects Module
- Contacts linked to projects via `crm_contact_project_links`
- Contact roles defined per project
- Project context influences research focus

### With Sales/CRM Dashboard
- Contact summary cards on dashboard
- "At-risk" signal if contact hasn't been contacted
- Research insights feed for relationship intelligence

### Future: With Social Content Operations
- Contact expertise used for content strategy
- Contact preferences inform content tone/style
- Contact mentions tracked in social listening

## Implementation Notes

### Current Limitations
1. **LinkedIn Fetching**: Mock implementation - extracts basic data from URL slug
   - **Solution**: Integrate with LinkedIn API or third-party scraping service

2. **Research Service**: AI-powered but doesn't access live web
   - **Solution**: Integrate with web search API (Perplexity, Google Custom Search, Bing) or web scraping service

3. **Online Presence**: Generated from context, not validated
   - **Solution**: Actually check URLs and verify presence

### Enhancement Opportunities

1. **Real LinkedIn API Integration**
   ```javascript
   // Use LinkedIn API v2
   const linkedin = require('linkedin-api');
   const profile = await linkedin.getProfile(linkedinUrl, accessToken);
   ```

2. **Web Search Integration**
   ```javascript
   // Use Perplexity or other search API
   const search = await perplexity.search(`${name} ${company}`);
   const news = await perplexity.search(`${name} news OR announcement`);
   ```

3. **Social Listening**
   ```javascript
   // Monitor mentions across social platforms
   // Track brand mentions by contact
   // Identify brand advocates vs detractors
   ```

4. **Enrichment Services**
   ```javascript
   // Use Hunter.io for email discovery
   // Use Apollo.io for contact enrichment
   // Use ZoomInfo for business intelligence
   ```

## Testing the Module

### Manual Testing Checklist

- [ ] Create a new contact with all fields
- [ ] Create contact with only required name field
- [ ] List contacts for different brands
- [ ] Update contact information
- [ ] Delete a contact
- [ ] Add LinkedIn URL and click "Fetch"
- [ ] Link contact to a project
- [ ] Unlink contact from project
- [ ] View project contacts
- [ ] Trigger research endpoint
- [ ] View research data on contact detail
- [ ] Edit contact while research data exists

### API Testing Commands

```bash
# Create contact
curl -X POST http://localhost:3000/api/crm/contacts/brand-123 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "title": "Marketing Director",
    "linkedin_url": "https://linkedin.com/in/johndoe"
  }'

# List contacts
curl http://localhost:3000/api/crm/contacts/brand-123

# Fetch LinkedIn profile
curl -X POST http://localhost:3000/api/linkedin/profile \
  -H "Content-Type: application/json" \
  -d '{ "url": "https://linkedin.com/in/johndoe" }'

# Conduct research
curl -X POST http://localhost:3000/api/contacts/contact-123/research \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "title": "Marketing Director",
    "company": "TechCorp"
  }'
```

## Files Modified/Created

### Database
- `db.js`: Added contact tables and functions

### Backend
- `index.js`: Added contact API endpoints and intelligence services
- `services/linkedinProfileFetcher.js`: LinkedIn profile fetching service
- `services/contactResearchService.js`: Online research service

### Frontend
- `frontend/app/use-cases/crm/contacts/page.tsx`: Contacts list
- `frontend/app/use-cases/crm/contacts/new/page.tsx`: Create contact form
- `frontend/app/use-cases/crm/contacts/detail/page.tsx`: Contact detail & edit
- `frontend/app/use-cases/crm/layout.tsx`: Added Contacts nav item

## Next Steps

1. **Production LinkedIn Integration**: Replace mock with real LinkedIn API or scraping service
2. **Web Research Integration**: Add live web search for online presence discovery
3. **Contact Enrichment**: Integrate with enrichment services (Hunter.io, Apollo.io)
4. **Social Listening**: Track contact mentions and brand advocacy
5. **Advanced Matching**: Match contacts from email signatures, LinkedIn URLs, etc.
6. **Contact Hierarchy**: Support for contact reporting relationships
7. **Contact Syncing**: Two-way sync with external CRM systems
8. **Contact Scoring**: AI-powered contact scoring for sales prioritization

## FAQ

**Q: How are contacts different from brands/clients?**
A: Brands are companies. Contacts are people at those companies. Contacts are primarily linked to projects they work on, not directly to brands (though they have a `client_id` for context).

**Q: Can a contact work on multiple projects?**
A: Yes! Use `crm_contact_project_links` to link a contact to multiple projects with different roles.

**Q: Where does the LinkedIn data come from?**
A: Currently a mock implementation that generates realistic data from the LinkedIn URL slug. Should be replaced with real API integration.

**Q: How is research conducted?**
A: Uses Claude Haiku to analyze context (name, title, company) and generate plausible insights. Should be enhanced with real web search and data enrichment services.

**Q: Can I export contact data?**
A: Yes - all contact data is stored in PostgreSQL and can be exported via API. Frontend download functionality can be added.

---

**Module Status**: ✅ MVP Complete - Ready for Production Integration Enhancement
**Last Updated**: 2026-02-20
