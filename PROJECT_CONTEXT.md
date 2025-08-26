# Project Context

## Overview
Job Search Simple is a modern, comprehensive job application tracking system with user authentication, enhanced data modeling, and real-time database operations. It helps job seekers manage their application process with professional features and detailed tracking capabilities.

## Purpose
- Track job applications throughout the hiring process
- Manage professional profile and career information
- Organize todos and follow-up tasks related to job search activities
- Provide insights into application patterns and success rates
- Streamline the job search workflow with automated features

## Target Users
- Job seekers at all career levels (Entry to Executive)
- Career changers looking to organize their search process
- Professionals managing multiple concurrent applications
- Users who want detailed tracking and analytics of their job search

## Key Features

### Core Application Management
- **Job Application Tracking**: Complete lifecycle from pre-application to final outcome
- **Company Database**: Shared company information across users
- **Status Timeline**: Track progress through interview stages
- **Enhanced Data Model**: Salary ranges, locations, priority levels, and detailed metadata

### User Management & Authentication
- **Supabase Authentication**: Secure email/password authentication
- **Professional Profiles**: Comprehensive user profiles with skills, experience, and career information
- **Profile Data Import**: Upload and import profile data from JSON files (resume parsers)

### Task & Todo Management
- **Todo System**: Linked todos with job applications
- **Priority Management**: High/Medium/Low priority categorization
- **Due Date Tracking**: Calendar-based task management
- **Categories**: Follow-up, Preparation, Networking, Administrative, Career Development

### Advanced Features
- **LinkedIn Company Discovery**: Automated company LinkedIn page discovery with multi-provider fallback
- **Smart Confidence Scoring**: AI-powered matching and ranking of LinkedIn search results
- **Rate Limiting & Fallback**: Intelligent provider switching when API limits are reached
- **Job Description Management**: Modal system with JSON and plain text formatting support
- **v2.3.0 Template Support**: Structured job descriptions with inference tracking and compatibility layer
- **Job Board Matrix**: Professional directory of 42+ job platforms across 6 specialized categories
- **Application Data Upload**: JSON template system for bulk import with LinkedIn integration
- **Template Detection**: Automatic identification of v2.3.0 vs legacy template formats
- **Beta Invite System**: Controlled user access with email validation
- **Email Integration**: Automated email workflows and notifications
- **File Upload**: Resume and job description processing with multiple format support
- **Real-time Updates**: Live database synchronization
- **Row Level Security**: Secure data isolation per user

## Technology Stack

### Frontend
- **React 18.3.1** with TypeScript
- **Vite 7.0.4** for build tooling and development server
- **Tailwind CSS 3.4.17** for styling
- **React Context** for state management

### Backend & Database
- **Supabase** (PostgreSQL + Authentication + Real-time)
- **Row Level Security (RLS)** policies for data protection
- **Express.js 5.1.0** for email and LinkedIn API server
- **Multi-Provider Search APIs**: Brave Search, Serper, Bing Search
- **CORS** enabled for cross-origin requests

### Development & Testing
- **TypeScript** for type safety
- **ESLint** for code linting
- **Jest** for unit testing
- **Playwright** for end-to-end testing
- **Cypress** for additional E2E testing
- **Concurrently** for running multiple development servers

### Deployment & DevOps
- **Netlify** for hosting and continuous deployment
- **Environment Variables** for secure configuration
- **Server Scripts** for database operations and email services

## Architecture

### Database Schema
- **users**: Professional profiles with career information
- **companies**: Shared company database with industry details and LinkedIn URLs
- **applications**: Job applications with comprehensive tracking
- **application_timeline**: Status change history
- **todos**: Task management linked to applications
- **beta_invites**: Controlled access system
- **linkedin_search_cache**: Cached LinkedIn search results for performance
- **linkedin_search_metrics**: Analytics and usage tracking for LinkedIn features

### Security Model
- Row Level Security ensures users only access their own data
- Authentication required for all database operations
- Environment variables for sensitive configuration
- Input validation and sanitization throughout

### Component Structure
```
src/
├── components/          # React UI components
│   ├── JobBoardMatrix.tsx       # Professional job board directory
│   ├── JobDescriptionUpload.tsx # v2.3.0 template upload system
│   └── ...
├── contexts/           # Authentication and global state
├── data/               # Static data and configurations
│   └── jobBoardsData.ts        # Job board directory data
├── hooks/              # Custom React hooks
├── types/              # TypeScript type definitions
│   └── inference.ts            # v2.3.0 inference tracking types
├── utils/              # Database operations and utilities
├── database/           # SQL schema and migrations
└── test/               # Comprehensive test suites
```

## Current Status

### Production Ready Features
- ✅ Complete authentication system
- ✅ Job application CRUD operations
- ✅ User profile management with data import
- ✅ Todo system with job linking
- ✅ Company management with LinkedIn discovery
- ✅ Multi-provider LinkedIn search (Brave, Serper, Bing)
- ✅ Smart confidence scoring and company standardization
- ✅ Rate limiting with graceful fallback handling
- ✅ Job description modal with JSON/plain text formatting
- ✅ v2.3.0 template support with structured job descriptions
- ✅ Job Board Matrix with 42+ professional platforms
- ✅ Template detection and automatic processing
- ✅ Database compatibility layer for v2.3.0 fields
- ✅ Application data upload with JSON template system
- ✅ Beta invite system
- ✅ Email integration
- ✅ Responsive mobile design
- ✅ Comprehensive testing suite

### Recent Enhancements
- **v2.3.0 Template System**: Complete structured job description support with inference tracking
- **Job Board Matrix**: Professional directory of 42+ job platforms across 6 specialized categories
- **Template Detection Engine**: Automatic identification of v2.3.0 vs legacy template formats
- **Database Compatibility Layer**: Field filtering system to support v2.3.0 without schema migration
- **Structured Job Description Forms**: Purpose, responsibilities, requirements, benefits, working conditions
- **LinkedIn Company Discovery**: Multi-provider search system with Brave, Serper, and Bing fallback
- **Smart Company Detection**: Automatic LinkedIn URL discovery with confidence scoring
- **Enhanced Company Selector**: Integrated LinkedIn search within company selection workflow
- **Job Description Modal System**: Professional modal with JSON and plain text formatting
- **Application Data Templates**: JSON upload system with comprehensive field mapping
- **Smart Job Description Parsing**: Automatic section detection and bullet point formatting
- **Lucide Icon Integration**: Consistent iconography throughout the application
- Profile data upload from JSON files
- Enhanced form validation
- Performance optimizations
- Database connection improvements
- Email server setup
- Premium job card implementation

## Next Steps

### Planned Enhancements
- Database schema migration to support v2.3.0 structured fields permanently
- Advanced analytics dashboard with inference tracking metrics
- Export functionality for applications (including structured job descriptions)
- Integration with external job boards via Job Board Matrix
- Calendar integration for interview scheduling
- Advanced filtering and search capabilities
- Notification system improvements
- Bulk template processing for multiple applications
- Enhanced inference confidence scoring and validation

### Technical Improvements
- Progressive Web App (PWA) features
- Offline functionality
- Advanced caching strategies
- Database query optimizations
- Enhanced error handling and logging

## Important Notes

### Environment Setup
- Requires Supabase project configuration
- Environment variables must be set for both frontend and backend
- Email server requires additional setup for full functionality

### Development Workflow
- Use `npm run dev` for development server
- Use `npm run dev:email` for email functionality testing
- Beta validation system controls new user registration
- Comprehensive test suite covers all major functionality

### Security Considerations
- All database operations protected by RLS policies
- User data completely isolated between accounts
- Secure handling of authentication tokens
- Input validation prevents injection attacks

### Performance
- Real-time database updates via Supabase
- Optimized component rendering
- File upload size limits (5MB)
- Efficient query patterns with proper indexing