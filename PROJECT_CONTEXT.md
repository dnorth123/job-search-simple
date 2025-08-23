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
- **Beta Invite System**: Controlled user access with email validation
- **Email Integration**: Automated email workflows and notifications
- **File Upload**: Resume and job description processing
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
- **Express.js 5.1.0** for email API server
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
- **companies**: Shared company database with industry details
- **applications**: Job applications with comprehensive tracking
- **application_timeline**: Status change history
- **todos**: Task management linked to applications
- **beta_invites**: Controlled access system

### Security Model
- Row Level Security ensures users only access their own data
- Authentication required for all database operations
- Environment variables for sensitive configuration
- Input validation and sanitization throughout

### Component Structure
```
src/
├── components/          # React UI components
├── contexts/           # Authentication and global state
├── hooks/              # Custom React hooks
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
- ✅ Company management
- ✅ Beta invite system
- ✅ Email integration
- ✅ Responsive mobile design
- ✅ Comprehensive testing suite

### Recent Enhancements
- Profile data upload from JSON files
- Enhanced form validation
- Performance optimizations
- Database connection improvements
- Email server setup
- Premium job card implementation

## Next Steps

### Planned Enhancements
- Advanced analytics dashboard
- Export functionality for applications
- Integration with external job boards
- Calendar integration for interview scheduling
- Advanced filtering and search capabilities
- Notification system improvements

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