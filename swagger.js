const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '5ML Agentic AI Platform API',
      version: '1.0.0',
      description: 'AI-powered multi-agent analysis system with Claude and Perplexity integration',
      contact: {
        name: '5ML Agency',
      },
    },
    servers: [
      {
        url: 'https://5ml-agenticai-v1.fly.dev',
        description: 'Production server',
      },
      {
        url: 'http://localhost:8080',
        description: 'Development server',
      },
    ],
    tags: [
      {
        name: 'Analysis',
        description: 'General AI analysis endpoints',
      },
      {
        name: 'Agents',
        description: 'Specialized AI agents (Creative, SEO, Social, Research)',
      },
      {
        name: 'Projects',
        description: 'Project history and database operations',
      },
      {
        name: 'Webhooks',
        description: 'GitHub webhook integration',
      },
      {
        name: 'Health',
        description: 'System health and status',
      },
    ],
    components: {
      schemas: {
        AnalysisRequest: {
          type: 'object',
          required: ['client_name', 'brief'],
          properties: {
            client_name: {
              type: 'string',
              description: 'Client or company name',
              example: '5ML Agency',
            },
            brief: {
              type: 'string',
              description: 'Project description or requirements',
              example: 'Create a marketing campaign for new product launch',
            },
            industry: {
              type: 'string',
              description: 'Industry or sector (optional)',
              example: 'Digital Marketing',
            },
          },
        },
        AgentRequest: {
          type: 'object',
          required: ['client_name', 'brief'],
          properties: {
            client_name: {
              type: 'string',
              description: 'Client or company name',
              example: 'Tech Startup',
            },
            brief: {
              type: 'string',
              description: 'Project brief or query',
              example: 'Improve SEO ranking for e-commerce website',
            },
          },
        },
        AnalysisResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            project_id: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000',
            },
            client_name: {
              type: 'string',
              example: '5ML Agency',
            },
            analysis: {
              type: 'object',
              description: 'Analysis results in structured format',
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              example: '2026-01-17T12:00:00Z',
            },
          },
        },
        AgentResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            agent: {
              type: 'string',
              enum: ['creative', 'seo', 'social', 'research'],
              example: 'research',
            },
            client_name: {
              type: 'string',
              example: 'Tech Startup',
            },
            analysis: {
              type: 'object',
              description: 'Agent-specific analysis results',
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        AgentList: {
          type: 'object',
          properties: {
            available_agents: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: {
                    type: 'string',
                    example: 'research',
                  },
                  endpoint: {
                    type: 'string',
                    example: '/agents/research',
                  },
                  description: {
                    type: 'string',
                    example: '🔍 Web research with Perplexity AI',
                  },
                },
              },
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        ProjectList: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
            },
            projects: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  project_id: {
                    type: 'string',
                    format: 'uuid',
                  },
                  client_name: {
                    type: 'string',
                  },
                  brief: {
                    type: 'string',
                  },
                  industry: {
                    type: 'string',
                  },
                  created_at: {
                    type: 'string',
                    format: 'date-time',
                  },
                },
              },
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              example: 'Error message',
            },
          },
        },
      },
    },
  },
  apis: ['./index.js'], // Path to the API routes
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
