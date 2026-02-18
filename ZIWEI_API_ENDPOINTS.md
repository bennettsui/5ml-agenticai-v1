# Ziwei Knowledge Center - API Endpoints

**Base URL:** `/api/ziwei`

---

## 1. Knowledge Gaps Management

### GET `/knowledge/gaps`
**Description:** Retrieve all knowledge gaps with current status

**Response:**
```json
{
  "success": true,
  "gaps": [
    {
      "id": "gap-001",
      "category": "104 Stars Complete Meanings",
      "description": "All 104 stars with detailed palace interpretations",
      "severity": "CRITICAL",
      "coverage": 14,
      "itemsNeeded": 104,
      "itemsComplete": 14,
      "priority": 1,
      "estimatedTokens": 12000,
      "targetPhase": 1,
      "relatedSources": ["source-001", "source-002"]
    }
  ],
  "metrics": {
    "totalGaps": 20,
    "criticalGaps": 6,
    "avgCoverage": 15
  }
}
```

### GET `/knowledge/gaps/:gapId`
**Description:** Get detailed information about a specific gap

**Response:**
```json
{
  "gap": {...},
  "relatedSources": [...],
  "suggestedSources": [...],
  "estimatedCost": 12000,
  "progress": {
    "completed": 14,
    "inProgress": 2,
    "pending": 88
  }
}
```

### POST `/knowledge/gaps/:gapId/start-scraping`
**Description:** Start scraping to fill a specific knowledge gap

**Request:**
```json
{
  "phase": 1,
  "maxTokens": 15000,
  "prioritySources": ["source-001", "source-002"]
}
```

**Response:**
```json
{
  "success": true,
  "scrapingJobId": "job-12345",
  "estimatedDuration": "2 hours",
  "estimatedCost": 12000
}
```

---

## 2. Scraping Sources Management

### GET `/scraping/sources`
**Description:** Get all scraping sources with current status

**Response:**
```json
{
  "success": true,
  "sources": [
    {
      "id": "source-001",
      "name": "Zhihu - Wang Ting Zhi Collection",
      "url": "https://zhuanlan.zhihu.com/p/690223394",
      "authority": "⭐⭐⭐⭐⭐",
      "priority": 1,
      "status": "completed",
      "progress": 100,
      "itemsFound": 450,
      "lastRun": "2026-02-18T10:30:00Z",
      "nextRun": "2026-03-18T10:30:00Z"
    }
  ],
  "summary": {
    "totalSources": 32,
    "activeSources": 5,
    "completedSources": 12
  }
}
```

### GET `/scraping/sources/:sourceId`
**Description:** Get detailed status of a specific source

**Response:**
```json
{
  "source": {...},
  "findings": {
    "total": 450,
    "byType": {
      "star": 200,
      "palace_meaning": 150,
      "transformation": 50,
      "pattern": 50
    }
  },
  "quality": {
    "avgConfidence": 0.82,
    "conflicts": 12,
    "validated": 300
  },
  "schedule": {
    "lastRun": "2026-02-18T10:30:00Z",
    "nextRun": "2026-03-18T10:30:00Z",
    "frequency": "monthly"
  }
}
```

### POST `/scraping/sources/:sourceId/scrape`
**Description:** Manually trigger scraping for a source

**Request:**
```json
{
  "force": false,
  "maxItems": 1000,
  "retryOnError": true
}
```

**Response:**
```json
{
  "success": true,
  "jobId": "scrape-job-789",
  "status": "started",
  "estimatedDuration": "30 minutes",
  "estimatedItemsToFind": 450
}
```

### PUT `/scraping/sources/:sourceId/config`
**Description:** Update source configuration

**Request:**
```json
{
  "priority": 1,
  "enabled": true,
  "frequency": "weekly",
  "maxTokens": 5000
}
```

---

## 3. Scraping Phases Management

### GET `/scraping/phases`
**Description:** Get all scraping phases with progress

**Response:**
```json
{
  "success": true,
  "phases": [
    {
      "phaseNumber": 1,
      "name": "Critical Foundation",
      "description": "Primary sources (王亭之, Official institutes)",
      "status": "in_progress",
      "progress": 45,
      "startDate": "2026-02-18T00:00:00Z",
      "estimatedEndDate": "2026-03-04T00:00:00Z",
      "sources": [...],
      "estimatedTokens": 50000,
      "tokensUsed": 22500,
      "targetConfidence": 0.85,
      "currentAvgConfidence": 0.82
    }
  ]
}
```

### GET `/scraping/phases/:phaseNumber`
**Description:** Get detailed status of a specific phase

**Response:**
```json
{
  "phase": {...},
  "timeline": {
    "weeks": "1-2",
    "estimatedDuration": 14,
    "daysRemaining": 7
  },
  "budget": {
    "allocated": 50000,
    "used": 22500,
    "remaining": 27500
  },
  "quality": {
    "itemsScraped": 850,
    "itemsValidated": 750,
    "itemsIntegrated": 600,
    "averageConfidence": 0.82
  },
  "sourceBreakdown": [
    {
      "sourceId": "source-001",
      "name": "Zhihu - Wang Ting Zhi",
      "itemsFound": 450,
      "progress": 100
    }
  ]
}
```

### POST `/scraping/phases/:phaseNumber/start`
**Description:** Start a specific scraping phase

**Request:**
```json
{
  "maxDailyTokens": 50000,
  "autoIntegrate": false
}
```

**Response:**
```json
{
  "success": true,
  "phaseNumber": 1,
  "status": "started",
  "firstJobId": "job-100",
  "scheduledCompletionDate": "2026-03-04T00:00:00Z"
}
```

### POST `/scraping/phases/:phaseNumber/pause`
**Description:** Pause an active phase

**Response:**
```json
{
  "success": true,
  "phaseNumber": 1,
  "status": "paused",
  "progressSnapshot": 45
}
```

### POST `/scraping/phases/:phaseNumber/resume`
**Description:** Resume a paused phase

**Response:**
```json
{
  "success": true,
  "phaseNumber": 1,
  "status": "in_progress",
  "resumedAt": "2026-02-20T10:00:00Z"
}
```

---

## 4. Scraping Jobs Tracking

### GET `/scraping/jobs`
**Description:** Get all active and completed scraping jobs

**Query Parameters:**
- `status`: pending, running, completed, failed
- `phase`: 1, 2, 3, 4
- `limit`: 50 (default)

**Response:**
```json
{
  "success": true,
  "jobs": [
    {
      "jobId": "job-100",
      "phase": 1,
      "source": "source-001",
      "status": "completed",
      "startedAt": "2026-02-18T10:00:00Z",
      "completedAt": "2026-02-18T12:30:00Z",
      "itemsFound": 450,
      "itemsProcessed": 420,
      "avgConfidence": 0.82,
      "tokensUsed": 12000,
      "estimatedCost": "$0.12"
    }
  ],
  "summary": {
    "totalJobs": 150,
    "activeJobs": 3,
    "completedJobs": 140,
    "failedJobs": 7
  }
}
```

### GET `/scraping/jobs/:jobId`
**Description:** Get detailed status of a specific job

**Response:**
```json
{
  "job": {...},
  "progress": {
    "itemsScraped": 420,
    "itemsValidated": 380,
    "itemsIntegrated": 360,
    "itemsFailed": 20
  },
  "quality": {
    "avgConfidence": 0.82,
    "devilsAdvocateCritiques": 15,
    "conflicts": 3,
    "integrated": 360
  },
  "logs": [
    {
      "timestamp": "2026-02-18T10:00:00Z",
      "level": "info",
      "message": "Started scraping Zhihu source"
    }
  ]
}
```

---

## 5. Scraped Items Management

### GET `/scraping/items`
**Description:** Get scraped items with filtering

**Query Parameters:**
- `status`: scraped, validated, critiqued, integrated, rejected
- `source`: source ID
- `type`: star, palace_meaning, transformation, luck_cycle, pattern
- `confidenceMin`: 0.0-1.0
- `confidenceMax`: 0.0-1.0

**Response:**
```json
{
  "success": true,
  "items": [
    {
      "id": "item-001",
      "sourceId": "source-001",
      "itemType": "star",
      "content": {
        "name": "紫微",
        "palaces": {...}
      },
      "confidence": 0.85,
      "status": "integrated",
      "scrapedAt": "2026-02-18T10:15:00Z",
      "validatedAt": "2026-02-18T11:00:00Z",
      "integratedAt": "2026-02-18T12:00:00Z",
      "devilsAdvocateNotes": "Strong source, well-documented"
    }
  ],
  "pagination": {
    "total": 850,
    "page": 1,
    "limit": 50
  }
}
```

### POST `/scraping/items/:itemId/validate`
**Description:** Manually validate a scraped item

**Request:**
```json
{
  "approveChanges": true,
  "notes": "Verified against multiple sources"
}
```

**Response:**
```json
{
  "success": true,
  "itemId": "item-001",
  "status": "validated",
  "confidence": 0.85,
  "validatedAt": "2026-02-18T11:00:00Z"
}
```

### POST `/scraping/items/:itemId/integrate`
**Description:** Integrate a validated item into knowledge base

**Response:**
```json
{
  "success": true,
  "itemId": "item-001",
  "status": "integrated",
  "integratedAt": "2026-02-18T12:00:00Z",
  "dbInsertId": "db-record-123"
}
```

### POST `/scraping/items/batch-integrate`
**Description:** Integrate multiple items at once

**Request:**
```json
{
  "itemIds": ["item-001", "item-002", "item-003"],
  "targetTable": "stars",
  "autoResolveConflicts": true
}
```

**Response:**
```json
{
  "success": true,
  "integrated": 3,
  "failed": 0,
  "conflicts": 0,
  "totalTime": "5.2 seconds"
}
```

---

## 6. Quality Control & Validation

### GET `/validation/conflicts`
**Description:** Get items with conflicting interpretations

**Response:**
```json
{
  "success": true,
  "conflicts": [
    {
      "conflictId": "conflict-001",
      "itemType": "star",
      "content": "紫微 meaning in 命宮",
      "sources": [
        {
          "sourceId": "source-001",
          "interpretation": "..."
        },
        {
          "sourceId": "source-002",
          "interpretation": "..."
        }
      ],
      "resolution": "pending",
      "notes": "需要 Wang Ting Zhi 验证"
    }
  ],
  "summary": {
    "totalConflicts": 12,
    "resolvedConflicts": 8,
    "pendingConflicts": 4
  }
}
```

### POST `/validation/conflicts/:conflictId/resolve`
**Description:** Resolve a conflict

**Request:**
```json
{
  "resolutionType": "prioritize_source",
  "prioritySourceId": "source-001",
  "reasoning": "王亭之 authority"
}
```

**Response:**
```json
{
  "success": true,
  "conflictId": "conflict-001",
  "resolution": "resolved",
  "selectedInterpretation": "..."
}
```

### GET `/validation/devil-advocate-reviews`
**Description:** Get Devil's Advocate critique results

**Response:**
```json
{
  "success": true,
  "reviews": [
    {
      "reviewId": "review-001",
      "itemId": "item-001",
      "critiques": [
        {
          "level": "HIGH",
          "issue": "Single source bias",
          "recommendation": "Need cross-validation from tier-2 sources"
        }
      ],
      "confidenceAdjustment": -0.05,
      "finalConfidence": 0.80,
      "status": "addressed"
    }
  ],
  "summary": {
    "totalReviews": 450,
    "avgCritiques": 2.3,
    "highRiskItems": 25
  }
}
```

---

## 7. Metrics & Reporting

### GET `/metrics/overview`
**Description:** Get comprehensive metrics dashboard

**Response:**
```json
{
  "success": true,
  "metrics": {
    "coverage": {
      "overall": 15,
      "stars": 14,
      "palaces": 100,
      "transformations": 0,
      "patterns": 25
    },
    "budget": {
      "totalBudgeted": 142000,
      "totalUsed": 22500,
      "remaining": 119500,
      "costPerItem": 37.5
    },
    "quality": {
      "itemsScraped": 600,
      "itemsValidated": 500,
      "itemsIntegrated": 420,
      "avgConfidence": 0.82
    },
    "timeline": {
      "startDate": "2026-02-18T00:00:00Z",
      "currentPhase": 1,
      "estimatedCompletion": "2026-04-22T00:00:00Z",
      "daysRemaining": 64
    }
  }
}
```

### GET `/metrics/by-phase`
**Description:** Get metrics broken down by phase

**Response:**
```json
{
  "success": true,
  "phases": [
    {
      "phaseNumber": 1,
      "status": "in_progress",
      "progress": 45,
      "itemsScraped": 600,
      "itemsIntegrated": 420,
      "tokensUsed": 22500,
      "avgConfidence": 0.82,
      "daysRemaining": 7
    }
  ]
}
```

### POST `/metrics/export-report`
**Description:** Generate and export a comprehensive report

**Request:**
```json
{
  "format": "markdown",
  "includeLogs": true,
  "includeMetrics": true,
  "dateRange": "all"
}
```

**Response:**
```markdown
# Ziwei Knowledge Scraping Report

## Overall Metrics
- Knowledge Coverage: 15%
- Items Scraped: 600
...
```

---

## 8. Configuration Management

### GET `/config`
**Description:** Get current configuration

**Response:**
```json
{
  "budgets": {
    "dailyTokens": 50000,
    "weeklyTokens": 100000,
    "monthlyTokens": 200000
  },
  "qualityThresholds": {
    "minConfidenceForIntegration": 0.75,
    "devilsAdvocateEngagement": "smart"
  },
  "automationRules": {
    "autoIntegrateWhenConfident": true,
    "autoRetryFailed": true,
    "notifyOnCompletion": true
  }
}
```

### PUT `/config`
**Description:** Update configuration

**Request:**
```json
{
  "budgets": {
    "dailyTokens": 75000
  },
  "qualityThresholds": {
    "minConfidenceForIntegration": 0.80
  }
}
```

### POST `/config/reset`
**Description:** Reset all progress and configuration

**Request:**
```json
{
  "confirm": true
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Invalid phase number",
  "code": "INVALID_PHASE"
}
```

### 429 Too Many Requests
```json
{
  "success": false,
  "error": "Token budget exceeded",
  "code": "BUDGET_EXCEEDED",
  "retryAfter": 3600
}
```

### 503 Service Unavailable
```json
{
  "success": false,
  "error": "Scraping service unavailable",
  "code": "SERVICE_UNAVAILABLE",
  "reason": "Orchestrator recovering from error"
}
```

---

## WebSocket Events (Real-time Updates)

### Connection
```
ws://localhost:8080/api/ziwei/scraping/ws
```

### Events Received
```json
{
  "type": "scraping_progress",
  "jobId": "job-100",
  "sourceId": "source-001",
  "progress": 45,
  "itemsFound": 450,
  "timestamp": "2026-02-18T10:15:30Z"
}
```

---

**Last Updated:** 2026-02-18
**Version:** 1.0
