# Job Application Tracker with Supabase

A modern React TypeScript job application tracker with Supabase backend integration, featuring user authentication, enhanced data model, and real-time database operations.

## Features

- **User Authentication**: Sign up/sign in with email and password
- **Enhanced Data Model**: 
  - Users with professional profiles
  - Companies with detailed information
  - Applications with salary ranges, locations, and priority levels
  - Application timeline for status tracking
- **Real-time Database**: Supabase backend with Row Level Security
- **Modern UI**: Responsive design with enhanced form layout
- **Status Tracking**: Track application progress with timeline
- **Company Management**: Associate applications with companies

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Backend**: Supabase (PostgreSQL + Auth)
- **Styling**: CSS with modern design system
- **State Management**: React Context for authentication

## Database Schema

### Tables

1. **users** - User profiles with professional information
2. **companies** - Company information and details
3. **applications** - Job applications with enhanced metadata
4. **application_timeline** - Status tracking for applications

### Key Features

- Row Level Security (RLS) for data protection
- Foreign key relationships
- Automatic timestamps
- Indexed queries for performance

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd job-search-mvp
npm install
```

### 2. Set Up Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Get your project URL and anon key from Settings > API
3. Create a `.env.local` file in the project root:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Set Up Database Schema

1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `src/database/schema.sql`
4. Run the SQL to create all tables, policies, and functions

### 4. Configure Authentication

1. In your Supabase dashboard, go to Authentication > Settings
2. Enable Email authentication
3. Configure your site URL (e.g., `http://localhost:5173` for development)

### 5. Run the Application

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Usage

### First Time Setup

1. Sign up with your email and password
2. Fill in your professional profile information
3. Start adding job applications

### Adding Applications

1. Fill out the application form with:
   - Position title
   - Company (select from existing or create new)
   - Salary range (optional)
   - Location and remote policy
   - Application source
   - Priority level
   - Notes

2. Applications start with "Applied" status
3. Update status as you progress through the hiring process

### Managing Companies

- Companies are automatically created when you select them
- All users can view and use the same company database
- Company information is shared across the platform

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon/public key | Yes |

## Development

### Project Structure

```
src/
├── components/          # React components
├── contexts/           # React contexts (Auth)
├── hooks/              # Custom hooks
├── utils/              # Utility functions
│   ├── supabase.ts     # Supabase client
│   └── supabaseOperations.ts  # Database operations
├── database/           # Database schema
│   └── schema.sql      # SQL schema file
├── jobTypes.ts         # TypeScript type definitions
└── App.tsx             # Main application component
```

### Key Files

- `src/utils/supabase.ts` - Supabase client configuration
- `src/utils/supabaseOperations.ts` - All database operations
- `src/contexts/AuthContext.tsx` - Authentication context
- `src/database/schema.sql` - Database schema and policies

### Adding New Features

1. **Database Changes**: Update `schema.sql` and run in Supabase
2. **Type Definitions**: Add to `jobTypes.ts`
3. **Operations**: Add to `supabaseOperations.ts`
4. **UI Components**: Create in `components/` directory

## Security Features

- Row Level Security (RLS) policies ensure users only see their own data
- Authentication required for all operations
- Input validation and sanitization
- Secure environment variable handling

## Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Other Platforms

1. Build the project: `npm run build`
2. Deploy the `dist/` folder
3. Set environment variables in your hosting platform

## Troubleshooting

### Common Issues

1. **Environment Variables Not Found**
   - Ensure `.env.local` file exists in project root
   - Restart development server after adding variables

2. **Database Connection Errors**
   - Verify Supabase URL and key are correct
   - Check if schema has been applied to database

3. **Authentication Issues**
   - Ensure email auth is enabled in Supabase
   - Check site URL configuration in Supabase dashboard

4. **RLS Policy Errors**
   - Verify all policies are applied in database
   - Check user authentication status

### Getting Help

1. Check Supabase logs in dashboard
2. Review browser console for errors
3. Verify database schema is correctly applied
4. Test with a fresh user account

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details
# Trigger Netlify deployment
# Environment variables configured
# Supabase configured
