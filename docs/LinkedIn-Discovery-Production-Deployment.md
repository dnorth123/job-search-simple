# LinkedIn Discovery Production Deployment Guide

This comprehensive guide covers the deployment and production readiness of the LinkedIn Discovery feature for the Job Search Simple application.

## 🚀 Pre-Deployment Checklist

### Environment Setup
- [ ] **Environment Variables Configured**
  - [ ] `BRAVE_SEARCH_API_KEY` - Your Brave Search API key
  - [ ] `VITE_SUPABASE_URL` - Supabase project URL
  - [ ] `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
  - [ ] `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (for edge functions)
  - [ ] `NODE_ENV=production` - Set to production
  - [ ] `BRAVE_API_RATE_LIMIT=2000` - Monthly rate limit
  - [ ] `LINKEDIN_CACHE_TTL_DAYS=7` - Cache TTL in days
  - [ ] `LINKEDIN_CONFIDENCE_THRESHOLD=0.7` - Minimum confidence threshold

### Database Setup
- [ ] **Migrations Applied**
  - [ ] Run `20250822_124233_linkedin_discovery.sql` - Core tables
  - [ ] Run `20250822_150000_linkedin_production_indexes.sql` - Production indexes
  - [ ] Verify all tables created: `linkedin_search_cache`, `linkedin_search_metrics`
  - [ ] Verify indexes created and being used

- [ ] **Database Performance**
  - [ ] VACUUM and ANALYZE run on all tables
  - [ ] Query performance tested with EXPLAIN ANALYZE
  - [ ] Autovacuum settings optimized
  - [ ] Connection pooling configured

### Edge Functions Deployment
- [ ] **Supabase Edge Functions**
  - [ ] Deploy `discover-linkedin-company` function
  - [ ] Deploy `linkedin-health-check` function
  - [ ] Test functions from production environment
  - [ ] Verify CORS configuration
  - [ ] Test rate limiting functionality

### Security & Compliance
- [ ] **API Keys & Secrets**
  - [ ] All API keys stored securely (not in code)
  - [ ] Service role keys properly restricted
  - [ ] Environment variables secured
  - [ ] No secrets in client-side code

- [ ] **Rate Limiting**
  - [ ] Client-side rate limiting implemented
  - [ ] Server-side rate limiting active
  - [ ] IP-based throttling configured
  - [ ] Circuit breakers tested

- [ ] **Data Privacy**
  - [ ] No PII stored in LinkedIn cache
  - [ ] Analytics data anonymized
  - [ ] GDPR compliance measures in place
  - [ ] Data retention policies implemented

## 📋 Deployment Steps

### 1. Backend Deployment (Supabase)

```bash
# 1. Apply database migrations
supabase db push

# 2. Deploy edge functions
supabase functions deploy discover-linkedin-company
supabase functions deploy linkedin-health-check

# 3. Verify deployment
supabase functions list
```

### 2. Frontend Build & Deploy

```bash
# 1. Install dependencies
npm install

# 2. Run tests
npm run test

# 3. Type checking
npm run typecheck

# 4. Linting
npm run lint

# 5. Production build
npm run build

# 6. Deploy to hosting platform
# (Replace with your deployment command)
npm run deploy
```

### 3. Post-Deployment Verification

```bash
# Test the health check endpoint
curl -X POST https://your-project.supabase.co/functions/v1/linkedin-health-check \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'

# Test the discovery endpoint
curl -X POST https://your-project.supabase.co/functions/v1/discover-linkedin-company \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"companyName": "Microsoft"}'
```

## 🔧 Configuration Management

### Feature Flags Configuration
The feature flag system allows for gradual rollouts and A/B testing:

```typescript
// Default production configuration
const productionFlags = {
  linkedin_discovery_enabled: true,
  linkedin_auto_search: true,
  linkedin_manual_entry: true,
  linkedin_confidence_display: true,
  linkedin_advanced_caching: true,
  linkedin_monitoring_detailed: true,
  linkedin_rate_limit_strict: true,
  linkedin_error_boundary: true,
  linkedin_queue_system: true
};
```

### Monitoring Configuration
```typescript
// Production monitoring settings
const monitoringConfig = {
  enabled: true,
  sampleRate: 0.1, // 10% sampling in production
  healthCheckInterval: 300000, // 5 minutes
  alertThresholds: {
    errorRate: 0.05, // 5%
    responseTime: 5000, // 5 seconds
    cacheHitRate: 0.7 // 70%
  }
};
```

### Rate Limiting Configuration
```typescript
// Production rate limits
const rateLimits = {
  monthly: 2000,    // Brave API monthly quota
  daily: 67,        // ~2000/30 days
  perMinute: 10,    // Conservative per-minute limit
  burst: 5,         // Burst allowance
  ipHourly: 20      // Per-IP hourly limit
};
```

## 📊 Monitoring & Alerting

### Health Monitoring
The system includes comprehensive health monitoring:

1. **System Health Checks**
   - Database connectivity
   - Brave API availability
   - Cache system status
   - Edge function responsiveness

2. **Performance Metrics**
   - Response times
   - Cache hit rates
   - Error rates
   - API quota usage

3. **Circuit Breaker Monitoring**
   - Open circuit breakers
   - Failure thresholds
   - Recovery attempts

### Setting Up Alerts
Create alerts for critical metrics:

```sql
-- Example: Set up database alerts
-- (Adjust based on your monitoring solution)

-- High error rate alert
SELECT COUNT(*) FROM linkedin_search_metrics 
WHERE created_at >= NOW() - INTERVAL '1 hour'
  AND user_action = 'error'
HAVING COUNT(*) > 50;

-- Low cache hit rate alert  
SELECT cache_hit_rate_percent FROM linkedin_cache_performance
WHERE date = CURRENT_DATE
  AND cache_hit_rate_percent < 70;
```

### Recommended Monitoring Tools
- **Application Performance Monitoring**: Sentry, DataDog, New Relic
- **Database Monitoring**: Supabase built-in monitoring
- **Uptime Monitoring**: Pingdom, UptimeRobot
- **Log Aggregation**: LogRocket, Papertrail

## 🚨 Incident Response

### Escalation Procedures

1. **Level 1: Warning Alerts**
   - Cache hit rate below 70%
   - Response time above 3 seconds
   - Error rate above 2%
   
   **Action**: Monitor closely, investigate if persists

2. **Level 2: Critical Alerts**
   - Error rate above 5%
   - Response time above 5 seconds
   - API quota approaching 90%
   - Circuit breaker opened
   
   **Action**: Immediate investigation, consider fallbacks

3. **Level 3: Emergency**
   - Complete system failure
   - API quota exceeded
   - Security breach suspected
   
   **Action**: Immediate response, disable feature if necessary

### Emergency Procedures

#### Disable LinkedIn Discovery
```typescript
// Emergency disable via feature flag
linkedInFeatureFlags.updateFlag('linkedin_discovery_enabled', { 
  enabled: false,
  rolloutPercentage: 0 
});
```

#### Force Fallback Mode
```typescript
// Activate all fallback strategies
linkedInErrorRecovery.forceOpenCircuitBreaker('linkedin_search');
```

#### Clear Cache
```sql
-- Emergency cache clear
SELECT cleanup_expired_linkedin_cache();
DELETE FROM linkedin_search_cache WHERE created_at < NOW();
```

## 🔄 Maintenance Procedures

### Daily Maintenance
- [ ] Check system health dashboard
- [ ] Review error logs
- [ ] Monitor API quota usage
- [ ] Verify cache hit rates

### Weekly Maintenance
- [ ] Run database cleanup functions
- [ ] Review performance metrics
- [ ] Check for new recommendations
- [ ] Update feature flag configurations

### Monthly Maintenance
- [ ] Analyze usage patterns
- [ ] Review and adjust rate limits
- [ ] Update monitoring thresholds
- [ ] Performance optimization review

### Quarterly Maintenance
- [ ] Security audit
- [ ] Disaster recovery testing
- [ ] Documentation updates
- [ ] Third-party dependency updates

## 🛠 Troubleshooting Guide

### Common Issues

#### High Error Rate
**Symptoms**: Error rate above 5%, user complaints
**Diagnosis**: Check monitoring dashboard, review error logs
**Solutions**:
1. Check Brave API status and quota
2. Verify database connectivity
3. Review recent deployments
4. Activate fallback strategies

#### Poor Performance
**Symptoms**: Response times above 5 seconds
**Diagnosis**: Query performance analysis, network checks
**Solutions**:
1. Check database query performance
2. Verify cache hit rates
3. Review API response times
4. Consider increasing cache TTL

#### Cache Issues
**Symptoms**: Low cache hit rate, storage warnings
**Diagnosis**: Cache performance metrics, storage usage
**Solutions**:
1. Run cache cleanup functions
2. Adjust TTL settings
3. Check cache invalidation logic
4. Review cache key strategies

## 📈 Performance Optimization

### Database Optimization
```sql
-- Regular maintenance queries
VACUUM ANALYZE linkedin_search_cache;
VACUUM ANALYZE linkedin_search_metrics;

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND tablename LIKE 'linkedin%'
ORDER BY idx_scan DESC;
```

### Application Optimization
- Implement request debouncing (500ms)
- Use connection pooling
- Optimize bundle sizes
- Enable gzip compression
- Implement service worker caching

## 🔐 Security Considerations

### API Security
- Keep Brave API key secure and rotated regularly
- Implement proper CORS policies
- Use HTTPS for all communications
- Monitor for API abuse patterns

### Data Security
- No sensitive user data in cache
- Encrypt data in transit and at rest
- Regular security audits
- Implement proper access controls

### Rate Limiting Security
- IP-based throttling
- Bot detection and blocking
- Gradual backoff for suspicious activity
- Circuit breakers for protection

## 📚 Additional Resources

### Documentation Links
- [Brave Search API Documentation](https://brave.com/search/api/)
- [Supabase Edge Functions Guide](https://supabase.com/docs/guides/functions)
- [React Error Boundaries](https://reactjs.org/docs/error-boundaries.html)

### Support Contacts
- **Development Team**: [Insert contact info]
- **DevOps Team**: [Insert contact info] 
- **Product Owner**: [Insert contact info]
- **Emergency Escalation**: [Insert contact info]

### Change Log
| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2024-08-22 | Initial production deployment |
| 1.1.0 | TBD | Performance optimizations |

---

## ✅ Final Deployment Verification

After deployment, verify the following functionality:

### Functional Testing
- [ ] LinkedIn company search works
- [ ] Cache system functioning
- [ ] Error handling working
- [ ] Fallback strategies active
- [ ] Rate limiting enforced
- [ ] Analytics being collected

### Performance Testing
- [ ] Response times under 3 seconds
- [ ] Cache hit rate above 70%
- [ ] Error rate below 2%
- [ ] No memory leaks detected

### Security Testing
- [ ] API keys not exposed
- [ ] Rate limiting prevents abuse
- [ ] CORS properly configured
- [ ] No sensitive data in logs

### Monitoring Testing
- [ ] Health checks responding
- [ ] Alerts configured and working
- [ ] Dashboards displaying correctly
- [ ] Metrics being collected

---

**Deployment Date**: _____________
**Deployed By**: _____________
**Verified By**: _____________
**Production URL**: _____________

**Notes**: 
_____________________________________________________________
_____________________________________________________________
_____________________________________________________________