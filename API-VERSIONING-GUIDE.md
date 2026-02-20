# 🔄 API Versioning Strategy

**Version**: v1.0
**Status**: Implementation Started
**Last Updated**: 2026-02-20

---

## Overview

API versioning is implemented to allow:
- **Breaking changes** in new versions without affecting existing clients
- **Gradual migration** of clients to new versions
- **Backwards compatibility** through version support
- **Clear deprecation** paths for old versions

---

## Current Version Strategy

### Version 1 (v1) - Current
- **Base URL**: `https://5ml-agenticai-v1.fly.dev/api/v1/`
- **Status**: Active & Maintained
- **Endpoints**: All Ziwei astrology endpoints
- **Validation**: Full input validation with express-validator

### Unversioned Endpoints
- **Legacy URL**: `https://5ml-agenticai-v1.fly.dev/api/`
- **Status**: Deprecated (will be removed in v2)
- **Recommendation**: Migrate to `/api/v1/`

---

## API Endpoint Mapping

### Knowledge Base Endpoints

#### v1 Format
```
GET  /api/v1/ziwei/knowledge/stats
GET  /api/v1/ziwei/knowledge/all
GET  /api/v1/ziwei/knowledge/search?q=keyword
GET  /api/v1/ziwei/knowledge/curriculum/:level
GET  /api/v1/ziwei/knowledge/combinations/:category
```

#### Response Format
```json
{
  "success": true,
  "version": "v1",
  "data": { /* endpoint-specific data */ },
  "meta": {
    "timestamp": "2026-02-20T12:34:56Z",
    "count": 100,
    "total": 500
  }
}
```

### Chart Calculation Endpoints

#### Calculate Birth Chart
```bash
POST /api/v1/ziwei/calculate
Content-Type: application/json

{
  "lunarYear": 1990,
  "lunarMonth": 6,
  "lunarDay": 15,
  "hourBranch": "午",
  "yearStem": "庚",
  "yearBranch": "午",
  "gender": "女",
  "name": "张某某",
  "placeOfBirth": "Hong Kong",
  "timezone": "Asia/Hong_Kong"
}
```

#### Response
```json
{
  "success": true,
  "version": "v1",
  "chartId": "uuid-here",
  "chart": { /* chart data */ },
  "meta": {
    "calculationTime": 234,
    "timestamp": "2026-02-20T12:34:56Z"
  }
}
```

### Interpretation Endpoints

#### Generate Interpretations
```bash
POST /api/v1/ziwei/interpret
Content-Type: application/json

{
  "chart": { /* chart data */ },
  "chartId": "optional-uuid",
  "consensusLevel": "consensus"
}
```

#### Response
```json
{
  "success": true,
  "version": "v1",
  "interpretations": [ /* array of interpretations */ ],
  "grouped": [ /* grouped by dimension */ ],
  "meta": {
    "totalInterpretations": 150,
    "consensusCount": 89,
    "avgConfidence": 0.78
  }
}
```

---

## Error Handling

### Standard Error Response Format

```json
{
  "success": false,
  "version": "v1",
  "error": "Validation error",
  "code": "VALIDATION_ERROR",
  "details": [
    {
      "field": "lunarYear",
      "message": "Lunar year must be between 1900 and 2100",
      "value": 2150
    }
  ],
  "timestamp": "2026-02-20T12:34:56Z"
}
```

### HTTP Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | Success | Chart calculation succeeded |
| 400 | Validation Error | Invalid year or gender |
| 401 | Unauthorized | Missing API key |
| 403 | Forbidden | Rate limit exceeded |
| 404 | Not Found | Chart ID doesn't exist |
| 500 | Server Error | Database connection failed |
| 503 | Service Unavailable | LLM service down |

---

## Input Validation Rules

### Chart Calculation Validation

```javascript
{
  lunarYear: {
    type: 'integer',
    min: 1900,
    max: 2100,
    required: true
  },
  lunarMonth: {
    type: 'integer',
    min: 1,
    max: 12,
    required: true
  },
  lunarDay: {
    type: 'integer',
    min: 1,
    max: 30,
    required: true
  },
  hourBranch: {
    type: 'enum',
    values: ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'],
    required: true
  },
  yearStem: {
    type: 'enum',
    values: ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'],
    required: true
  },
  yearBranch: {
    type: 'enum',
    values: ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'],
    required: true
  },
  gender: {
    type: 'enum',
    values: ['男', '女', 'Male', 'Female'],
    required: true
  },
  name: {
    type: 'string',
    minLength: 1,
    maxLength: 100,
    required: true
  },
  placeOfBirth: {
    type: 'string',
    maxLength: 100,
    required: false
  },
  timezone: {
    type: 'string',
    maxLength: 50,
    required: false
  }
}
```

---

## Migration Guide

### For Frontend Applications

**Before (Unversioned)**
```typescript
const response = await fetch('/api/ziwei/calculate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
});
```

**After (v1)**
```typescript
const response = await fetch('/api/v1/ziwei/calculate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Version': 'v1'  // Optional header
  },
  body: JSON.stringify(payload)
});
```

### For API Clients

Update your endpoints:

```python
# Before
BASE_URL = "https://5ml-agenticai-v1.fly.dev/api"

# After
BASE_URL = "https://5ml-agenticai-v1.fly.dev/api/v1"
```

---

## Version Deprecation Timeline

### v1 Deprecation (Future - v2 Release)
```
- v2 Released: When new features require breaking changes
- v1 Sunset Warning: 6 months before v1 endpoint removal
- v1 Deprecated: v1 endpoints return 410 Gone after sunset
- Support Window: 12 months of parallel version support
```

---

## Future Versions (Planning)

### v2 Planned Features
- [ ] GraphQL alternative endpoint
- [ ] WebSocket streaming for real-time calculations
- [ ] Batch API for multiple calculations
- [ ] Enhanced error messages with AI-powered suggestions
- [ ] Rate limiting by tier

### v3 Considerations
- [ ] Multi-language support (Chinese, English, etc.)
- [ ] Async job processing for heavy calculations
- [ ] Caching layer with CDN
- [ ] Analytics integration

---

## Development Guidelines

### Adding New Endpoints

1. **Create route in `/routes/v1/ziwei.js`**
   ```javascript
   router.post('/new-feature', validation, asyncHandler(async (req, res) => {
     // Implementation
   }));
   ```

2. **Add validation in `/validation/ziweiValidation.js`**
   ```javascript
   const validateNewFeature = [
     body('field').isType(...),
     handleValidationErrors
   ];
   ```

3. **Update this documentation**

### Testing New Endpoints

```bash
# Test with curl
curl -X POST https://localhost:8080/api/v1/ziwei/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "lunarYear": 1990,
    "lunarMonth": 6,
    "lunarDay": 15,
    "hourBranch": "午",
    "yearStem": "庚",
    "yearBranch": "午",
    "gender": "女",
    "name": "Test"
  }'

# Expect validation error response
{
  "success": false,
  "error": "Validation error",
  "details": [ ... ]
}
```

---

## Performance Considerations

### Response Caching

```javascript
// Cache knowledge endpoints for 1 hour
router.get('/knowledge/stats', (req, res) => {
  res.set('Cache-Control', 'public, max-age=3600');
  // ... implementation
});
```

### Rate Limiting

```javascript
// Recommended: Implement rate limiting per client
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/v1/', limiter);
```

---

## Monitoring & Analytics

### Key Metrics to Track

1. **Version Usage**
   - % of traffic on v1 vs unversioned endpoints
   - Migration progress

2. **Error Rates**
   - Validation errors by field
   - API errors by endpoint
   - 4xx vs 5xx error ratio

3. **Performance**
   - Average response time per endpoint
   - P95 and P99 latencies
   - Calculation times

### Dashboard Queries

```sql
-- Version distribution
SELECT version, COUNT(*) as requests
FROM api_logs
WHERE timestamp > NOW() - INTERVAL 7 DAY
GROUP BY version;

-- Error analysis
SELECT endpoint, error_code, COUNT(*) as count
FROM api_errors
WHERE timestamp > NOW() - INTERVAL 7 DAY
GROUP BY endpoint, error_code;
```

---

## Summary

✅ **Implemented**:
- v1 routing structure
- Input validation framework
- Error handling middleware
- Documentation

⏳ **Next Steps**:
1. Integrate v1 routes into main index.js
2. Update frontend to use /api/v1/ endpoints
3. Add rate limiting middleware
4. Set up API monitoring
5. Plan v2 features

---

**For Questions**: See ADVANCED-IMPLEMENTATION-RESEARCH.md for design patterns and best practices.
