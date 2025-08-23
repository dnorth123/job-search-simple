# LinkedIn Company Discovery - Testing Instructions

## Prerequisites

Before testing, ensure you have:

1. **Brave Search API Key**
   - Sign up at https://brave.com/search/api/
   - Generate an API key from the dashboard
   - Note: Free tier provides 2,000 queries/month

2. **Supabase Project Setup**
   - Supabase project with database access
   - Service role key for edge functions

## Setup Instructions

### 1. Environment Configuration

Add to your Supabase project's edge function secrets:

```bash
# In your Supabase dashboard, go to Edge Functions > Settings
BRAVE_SEARCH_API_KEY=your_brave_search_api_key_here
```

### 2. Database Migration

Run the migration to create the required tables:

```bash
# If using Supabase CLI locally
supabase db reset

# Or apply the specific migration
supabase db push
```

Alternatively, run the migration SQL directly in your Supabase SQL editor:
```sql
-- Copy and paste the contents of:
-- supabase/migrations/20250822_124233_linkedin_discovery.sql
```

### 3. Deploy Edge Function

```bash
# Deploy the edge function to your Supabase project
supabase functions deploy discover-linkedin-company

# Or if using the dashboard, upload the index.ts file
```

## Testing the Edge Function

### 1. Test Edge Function Locally (Development)

```bash
# Start local Supabase (if using local development)
supabase start

# Test the function locally
supabase functions serve discover-linkedin-company --env-file .env.local
```

### 2. Test with cURL Commands

#### Test Basic Functionality
```bash
curl -X POST \
  'https://your-project-ref.supabase.co/functions/v1/discover-linkedin-company' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"companyName": "Microsoft"}'
```

#### Test with Different Company Names
```bash
# Test well-known company
curl -X POST \
  'https://your-project-ref.supabase.co/functions/v1/discover-linkedin-company' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"companyName": "Apple"}'

# Test smaller company
curl -X POST \
  'https://your-project-ref.supabase.co/functions/v1/discover-linkedin-company' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"companyName": "Anthropic"}'

# Test company with multiple words
curl -X POST \
  'https://your-project-ref.supabase.co/functions/v1/discover-linkedin-company' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"companyName": "Goldman Sachs"}'
```

#### Test Error Conditions
```bash
# Test invalid input
curl -X POST \
  'https://your-project-ref.supabase.co/functions/v1/discover-linkedin-company' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"companyName": ""}'

# Test missing company name
curl -X POST \
  'https://your-project-ref.supabase.co/functions/v1/discover-linkedin-company' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{}'
```

### 3. Expected Response Format

#### Successful Response
```json
{
  "results": [
    {
      "url": "https://www.linkedin.com/company/microsoft/",
      "companyName": "Microsoft",
      "vanityName": "microsoft",
      "description": "We empower every person and every organization on the planet to achieve more.",
      "confidence": 0.95
    },
    {
      "url": "https://www.linkedin.com/company/microsoft-development-center-norway/",
      "companyName": "Microsoft Development Center Norway",
      "vanityName": "microsoft-development-center-norway",
      "description": "Microsoft Development Center Norway focuses on cloud and AI solutions.",
      "confidence": 0.75
    }
  ],
  "cached": false,
  "searchTerm": "Microsoft"
}
```

#### Cached Response
```json
{
  "results": [...],
  "cached": true,
  "searchTerm": "Microsoft"
}
```

#### Error Response
```json
{
  "error": "Invalid company name. Must be at least 2 characters.",
  "searchTerm": ""
}
```

## Database Verification

### 1. Check Tables Were Created
```sql
-- Verify linkedin_search_cache table
SELECT * FROM linkedin_search_cache LIMIT 5;

-- Verify linkedin_search_metrics table
SELECT * FROM linkedin_search_metrics LIMIT 5;

-- Check companies table has new columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'companies' 
AND column_name LIKE 'linkedin_%';
```

### 2. Verify Caching Functionality
```sql
-- After running a search, check if results were cached
SELECT search_term, created_at, expires_at, search_count 
FROM linkedin_search_cache 
ORDER BY created_at DESC;

-- Check analytics tracking
SELECT search_term, results_count, created_at 
FROM linkedin_search_metrics 
ORDER BY created_at DESC;
```

### 3. Test Cache Expiration
```sql
-- Manually expire a cache entry to test refresh
UPDATE linkedin_search_cache 
SET expires_at = NOW() - INTERVAL '1 day' 
WHERE search_term = 'microsoft';

-- Then test the same search again - should refresh cache
```

## Performance Testing

### 1. Test Response Times
```bash
# Time multiple requests
time curl -X POST \
  'https://your-project-ref.supabase.co/functions/v1/discover-linkedin-company' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"companyName": "Microsoft"}'
```

### 2. Test Rate Limiting
```bash
# Run multiple rapid requests to test rate limiting behavior
for i in {1..10}; do
  curl -X POST \
    'https://your-project-ref.supabase.co/functions/v1/discover-linkedin-company' \
    -H 'Authorization: Bearer YOUR_ANON_KEY' \
    -H 'Content-Type: application/json' \
    -d '{"companyName": "TestCompany'$i'"}' &
done
wait
```

## Integration Testing

### Test with Frontend (Optional Preview)

Create a simple HTML file to test the integration:

```html
<!DOCTYPE html>
<html>
<head>
    <title>LinkedIn Discovery Test</title>
</head>
<body>
    <div>
        <input type="text" id="companyInput" placeholder="Enter company name">
        <button onclick="searchLinkedIn()">Search</button>
        <div id="results"></div>
    </div>

    <script>
        async function searchLinkedIn() {
            const companyName = document.getElementById('companyInput').value;
            const resultsDiv = document.getElementById('results');
            
            try {
                const response = await fetch('https://your-project-ref.supabase.co/functions/v1/discover-linkedin-company', {
                    method: 'POST',
                    headers: {
                        'Authorization': 'Bearer YOUR_ANON_KEY',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ companyName })
                });
                
                const data = await response.json();
                
                if (data.results) {
                    resultsDiv.innerHTML = '<h3>Results:</h3>' + 
                        data.results.map(result => 
                            `<div style="border: 1px solid #ccc; margin: 10px; padding: 10px;">
                                <strong>${result.companyName}</strong> (${result.confidence})<br>
                                <a href="${result.url}" target="_blank">${result.url}</a><br>
                                <em>${result.description}</em>
                            </div>`
                        ).join('');
                } else {
                    resultsDiv.innerHTML = '<p>Error: ' + data.error + '</p>';
                }
            } catch (error) {
                resultsDiv.innerHTML = '<p>Network error: ' + error.message + '</p>';
            }
        }
    </script>
</body>
</html>
```

## Monitoring and Analytics

### Check Analytics View
```sql
-- View daily analytics
SELECT * FROM linkedin_discovery_analytics 
ORDER BY date DESC 
LIMIT 30;

-- Check cache hit rate
SELECT get_linkedin_cache_hit_rate(7) as cache_hit_rate_7_days;
```

### Monitor API Usage
```sql
-- Count total searches today
SELECT COUNT(*) as searches_today
FROM linkedin_search_metrics 
WHERE DATE(created_at) = CURRENT_DATE;

-- Average confidence scores
SELECT AVG(selection_confidence) as avg_confidence
FROM linkedin_search_metrics 
WHERE selection_confidence IS NOT NULL
AND created_at >= NOW() - INTERVAL '7 days';
```

## Troubleshooting

### Common Issues

1. **"Brave Search API key not configured"**
   - Check that `BRAVE_SEARCH_API_KEY` is set in Supabase edge function secrets
   - Verify the API key is valid at https://brave.com/search/api/

2. **CORS errors**
   - Ensure the edge function includes proper CORS headers
   - Check that the request includes proper Authorization header

3. **Database connection errors**
   - Verify Supabase URL and service role key
   - Check that migration has been applied

4. **Empty results**
   - Test with well-known companies first (Microsoft, Apple, Google)
   - Check Brave API response directly
   - Verify company name spelling

5. **Function timeout**
   - Check if Brave API is responding slowly
   - Monitor function logs in Supabase dashboard

### Debug Mode

Add logging to help debug issues:

```typescript
// Add to edge function for debugging
console.log('Search term:', companyName);
console.log('Brave API response:', data);
console.log('Processed results:', results);
```

## Success Criteria

The implementation is successful when:

1. ✅ Edge function deploys without errors
2. ✅ Database migration creates all required tables
3. ✅ Search for "Microsoft" returns LinkedIn URL with high confidence (>0.8)
4. ✅ Results are cached (second search returns `"cached": true`)
5. ✅ Analytics table tracks search metrics
6. ✅ Error handling works for invalid inputs
7. ✅ CORS works for browser requests

## Next Steps

Once basic functionality is verified:

1. Move to PROMPT 2: React Component Implementation
2. Test with various company names to tune confidence scoring
3. Monitor API usage to stay within rate limits
4. Consider implementing request queuing for high-traffic scenarios