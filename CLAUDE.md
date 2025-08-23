# Claude Configuration

## Project: Job Search Simple

This is a job search application with advanced LinkedIn company discovery functionality.

## Development Commands

- `npm run dev` - Start development server (port 5173)
- `npm run email-server` - Start email/LinkedIn API server (port 3001)  
- `npm run build` - Build for production
- `npm run test` - Run tests
- `npm run lint` - Run linter

## Key Features Implemented

### LinkedIn Company Discovery
- **Multi-provider search**: Brave Search → Serper → Bing → URL guessing fallback
- **Smart confidence scoring**: Automatic scoring based on company name matching and search result ranking
- **Edit mode handling**: Prevents re-searching when LinkedIn URL already exists
- **Company standardization**: Extracts standardized company names from LinkedIn results
- **Rate limiting**: Client and server-side rate limiting with graceful fallbacks

### Recent Fixes
- Fixed edit mode issue where LinkedIn search would re-trigger for existing applications
- Resolved database schema issues by simplifying to use only basic `linkedin_url` field
- Implemented proper component state management for LinkedIn URL persistence

## Project Structure

### Core Components
- `src/components/CompanySelectorWithLinkedIn.tsx` - Main company selector with LinkedIn integration
- `src/components/LinkedInCompanyDiscovery.tsx` - LinkedIn search and discovery UI
- `server/email-api.js` - Backend API server with LinkedIn search endpoints

### LinkedIn Infrastructure  
- `src/utils/linkedinRateLimit.ts` - Rate limiting utilities
- `src/utils/linkedinMonitoring.ts` - Monitoring and analytics
- `src/config/linkedinConfig.ts` - Configuration management
- `src/hooks/useDebounce.ts` - Debounced input handling

### Database
- `supabase/migrations/20250822_124233_linkedin_discovery.sql` - LinkedIn discovery database schema

## API Keys Required

### Environment Variables (.env)
```bash
# Supabase
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# LinkedIn Discovery  
VITE_BRAVE_SEARCH_API_KEY=your_brave_api_key
SERPER_API_KEY=your_serper_api_key  # Fallback provider
BING_SEARCH_API_KEY=your_bing_api_key  # Additional fallback

# Configuration
BRAVE_API_RATE_LIMIT=2000
LINKEDIN_CACHE_TTL_DAYS=7
LINKEDIN_CONFIDENCE_THRESHOLD=0.7
```

## Known Issues & Solutions

### Database Schema
- The full LinkedIn discovery schema migration may not be applied yet
- Current implementation uses simplified approach with only `linkedin_url` field
- Future enhancement: Apply full migration to enable confidence scores and discovery methods

### Rate Limiting
- Brave Search API has usage limits - implemented multi-provider fallback
- Server-side rate limiting prevents client-side blocking

## Testing

### Manual Testing Checklist
1. **New Application**: Type company name → LinkedIn search runs → Select result → URL saved
2. **Edit Existing**: Open application with LinkedIn URL → Shows selected state (no re-search)
3. **Edit Without LinkedIn**: Open application without LinkedIn → Search runs normally
4. **Fallback Providers**: Test when Brave API limit hit → Falls back to Serper/Bing

## Notes

- LinkedIn discovery is fully functional with multi-provider fallback system
- Edit mode issue has been resolved - no more re-triggering searches for existing URLs
- Database updates simplified to avoid schema dependency issues
- All changes have been committed and pushed to main branch

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.