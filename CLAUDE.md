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

### Job Description Management
- **Modal Display System**: Professional modal interface for viewing job descriptions
- **Dual Format Support**: JSON-structured data with smart plain text fallback
- **Automatic Formatting**: Intelligent parsing of sections (responsibilities, requirements, benefits)
- **Application Data Upload**: JSON template system for bulk application import
- **Company LinkedIn Integration**: Seamless LinkedIn URL extraction from upload data

### v2.3.0 Template Support
- **Structured Job Descriptions**: Purpose, responsibilities, requirements, benefits, working conditions
- **Inference Tracking**: Boolean flags for all fields with confidence scoring
- **Template Detection**: Automatic identification of v2.3.0 vs legacy templates
- **Form Integration**: Structured form fields for all job description components
- **Database Compatibility**: Field filtering until schema migration completed
- **Backward Compatibility**: Full support for legacy templates and plain text

### Job Board Matrix
- **Professional Directory**: 42+ job platforms across 6 specialized categories
- **Smart Categorization**: General, Product Management, UX/Design, Strategy, Contract, Executive
- **Search & Filtering**: Real-time search with category and source filtering
- **Platform Details**: Direct links, descriptions, tags, premium indicators
- **Responsive Design**: Mobile-optimized grid layout with professional styling

### Recent Fixes
- Fixed edit mode issue where LinkedIn search would re-trigger for existing applications
- Resolved database schema issues by simplifying to use only basic `linkedin_url` field
- Implemented proper component state management for LinkedIn URL persistence
- Added comprehensive job description storage and display system
- Fixed database field filtering to prevent v2.3.0 field submission until schema migration
- Successfully implemented v2.3.0 template upload with structured job descriptions

## Project Structure

### Core Components
- `src/components/CompanySelectorWithLinkedIn.tsx` - Main company selector with LinkedIn integration
- `src/components/LinkedInCompanyDiscovery.tsx` - LinkedIn search and discovery UI
- `src/components/JobDescriptionModal.tsx` - Modal for displaying formatted job descriptions
- `src/components/JobDescriptionUpload.tsx` - File upload with JSON template support
- `src/components/JobBoardMatrix.tsx` - Professional job board directory with search and filtering
- `src/components/JobCard.tsx` - Job application cards with description links
- `server/email-api.js` - Backend API server with LinkedIn search endpoints

### LinkedIn Infrastructure  
- `src/utils/linkedinRateLimit.ts` - Rate limiting utilities
- `src/utils/linkedinMonitoring.ts` - Monitoring and analytics
- `src/config/linkedinConfig.ts` - Configuration management
- `src/hooks/useDebounce.ts` - Debounced input handling

### v2.3.0 Template System
- `src/types/inference.ts` - TypeScript interfaces for inference tracking and structured data
- `src/data/jobBoardsData.ts` - Professional job board directory data (42+ platforms)
- `docs/enhanced_job_template_v2_2.json` - v2.3.0 template with structured job descriptions
- `test_v2_3_template.json` - Test template for v2.3.0 validation

### Database
- `supabase/migrations/20250822_124233_linkedin_discovery.sql` - LinkedIn discovery database schema
- Database compatibility layer filters v2.3.0 fields until schema migration
- Legacy template support maintained for backward compatibility

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
5. **v2.3.0 Template Upload**: Upload enhanced_job_template_v2_2.json → Structured form fields populated
6. **Legacy Template Upload**: Upload legacy JSON → Plain job description field populated
7. **Job Board Matrix**: Click "Job Boards" → Modal opens with 42+ categorized platforms
8. **Job Board Search**: Search platforms by name/tag → Real-time filtering works
9. **Job Description Modal**: Click "View Details" → Modal opens with formatted job description
10. **Structured Job Fields**: Fill out purpose, responsibilities, requirements → Data saves correctly

## Notes

- LinkedIn discovery is fully functional with multi-provider fallback system
- Edit mode issue has been resolved - no more re-triggering searches for existing URLs
- Database updates simplified to avoid schema dependency issues
- Job description modal system supports both JSON and plain text with intelligent formatting
- v2.3.0 template support fully implemented with structured job descriptions
- Job Board Matrix provides comprehensive directory of 42+ professional platforms
- Database compatibility layer ensures v2.3.0 templates work without schema changes
- Template upload supports both legacy and v2.3.0 formats with automatic detection
- All structured job description fields render in form but filtered before database submission
- CORS errors in development console from LinkedIn monitoring are expected and harmless
- All changes have been committed and pushed to main branch (commit: 4a5ae86)

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.