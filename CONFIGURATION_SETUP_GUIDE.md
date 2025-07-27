# Configuration Setup Guide

This guide provides step-by-step instructions to implement the performance optimizations for your job tracker application.

## Prerequisites

- Access to your Netlify dashboard
- Access to your Supabase dashboard
- Your project's environment variables

## Step 1: Netlify Configuration Updates

### 1.1 Update netlify.toml

The `netlify.toml` file has already been updated with performance optimizations. Verify the changes are in place:

```toml
[build]
  publish = "dist"
  command = "npm run build"

[build.environment]
  NODE_VERSION = "18"
  SECRETS_SCAN_OMIT_KEYS = "VITE_SUPABASE_ANON_KEY"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

# Performance optimizations
[[headers]]
  for = "/*"
  [headers.values]
    # Cache static assets for 1 year
    Cache-Control = "public, max-age=31536000, immutable"
    # Enable compression
    Content-Encoding = "gzip"
    # Security headers
    X-Content-Type-Options = "nosniff"
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"

[[headers]]
  for = "*.js"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
    Content-Type = "application/javascript"

[[headers]]
  for = "*.css"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
    Content-Type = "text/css"

[[headers]]
  for = "*.html"
  [headers.values]
    Cache-Control = "public, max-age=0, must-revalidate"
    Content-Type = "text/html"

# API routes (if any) - no caching
[[headers]]
  for = "/api/*"
  [headers.values]
    Cache-Control = "no-cache, no-store, must-revalidate"
    Pragma = "no-cache"
    Expires = "0"
```

### 1.2 Verify Environment Variables in Netlify

1. **Access Netlify Dashboard**:
   - Go to [netlify.com](https://netlify.com)
   - Sign in to your account
   - Select your job tracker site

2. **Navigate to Environment Variables**:
   - Go to **Site settings** → **Environment variables**
   - Verify these variables are set:

   | Variable Name | Value | Description |
   |---------------|-------|-------------|
   | `VITE_SUPABASE_URL` | `https://your-project.supabase.co` | Your Supabase project URL |
   | `VITE_SUPABASE_ANON_KEY` | `your-anon-key` | Your Supabase anon/public key |

3. **Add Variables if Missing**:
   - Click **Add a variable**
   - Enter the variable name and value
   - Click **Save**

## Step 2: Vite Configuration Optimization

### 2.1 Update vite.config.ts

The `vite.config.ts` file has been optimized. Verify the changes:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    // Optimize build performance
    target: 'esnext',
    minify: 'terser',
    rollupOptions: {
      output: {
        // Optimize chunk splitting
        manualChunks: {
          vendor: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js'],
        },
      },
    },
    // Reduce bundle size
    chunkSizeWarningLimit: 1000,
    // Enable source maps for debugging (disable in production)
    sourcemap: process.env.NODE_ENV === 'development',
  },
  // Optimize development server
  server: {
    hmr: {
      overlay: false, // Disable error overlay for better performance
    },
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', '@supabase/supabase-js'],
  },
})
```

## Step 3: Supabase Configuration

### 3.1 Update Supabase Client Configuration

The `src/utils/supabase.ts` file has been optimized. Verify the changes:

```typescript
// Optimized Supabase client configuration
export const supabase = createClient(supabaseUrl || 'https://demo.supabase.co', supabaseAnonKey || 'demo-key', {
  // Performance optimizations
  auth: {
    // Reduce auth state change delays
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // Faster token refresh
    flowType: 'pkce',
  },
  // Optimize realtime connections
  realtime: {
    params: {
      eventsPerSecond: 10, // Reduce event frequency for better performance
    },
  },
  // Global headers for better caching
  global: {
    headers: {
      'Cache-Control': 'max-age=300', // 5 minute cache for API responses
    },
  },
});
```

### 3.2 Supabase Dashboard Settings

1. **Access Supabase Dashboard**:
   - Go to [supabase.com](https://supabase.com)
   - Sign in to your account
   - Select your project

2. **Database Settings**:
   - Go to **Settings** → **Database**
   - Enable **Connection pooling** if available
   - Set **Connection limit** to an appropriate value (e.g., 10-20)
   - Enable **Query caching** if available

3. **API Settings**:
   - Go to **Settings** → **API**
   - Add your Netlify domain to **CORS origins**:
     ```
     https://your-site-name.netlify.app
     https://job-search-tracker-mvp.netlify.app
     ```
   - Set **Rate limiting** to appropriate values:
     - **Requests per second**: 100
     - **Requests per minute**: 1000

4. **Authentication Settings**:
   - Go to **Authentication** → **Settings**
   - Add your Netlify domain to **Site URL**:
     ```
     https://your-site-name.netlify.app
     ```
   - Add redirect URLs:
     ```
     https://your-site-name.netlify.app/auth/callback
     https://job-search-tracker-mvp.netlify.app/auth/callback
     ```

## Step 4: Database Optimization (Optional)

### 4.1 Add Database Indexes

1. **Access Supabase SQL Editor**:
   - Go to **SQL Editor** in your Supabase dashboard

2. **Add Indexes for Performance**:
   ```sql
   -- Index for user applications
   CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);
   
   -- Index for application status
   CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(current_status);
   
   -- Index for application dates
   CREATE INDEX IF NOT EXISTS idx_applications_date_applied ON applications(date_applied);
   
   -- Index for user profiles
   CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
   
   -- Composite index for efficient queries
   CREATE INDEX IF NOT EXISTS idx_applications_user_status ON applications(user_id, current_status);
   ```

### 4.2 Enable Row Level Security (RLS)

1. **Enable RLS on Tables**:
   ```sql
   -- Enable RLS on applications table
   ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
   
   -- Enable RLS on users table
   ALTER TABLE users ENABLE ROW LEVEL SECURITY;
   
   -- Create policies for applications
   CREATE POLICY "Users can view their own applications" ON applications
     FOR SELECT USING (auth.uid() = user_id);
   
   CREATE POLICY "Users can insert their own applications" ON applications
     FOR INSERT WITH CHECK (auth.uid() = user_id);
   
   CREATE POLICY "Users can update their own applications" ON applications
     FOR UPDATE USING (auth.uid() = user_id);
   
   CREATE POLICY "Users can delete their own applications" ON applications
     FOR DELETE USING (auth.uid() = user_id);
   
   -- Create policies for users
   CREATE POLICY "Users can view their own profile" ON users
     FOR SELECT USING (auth.uid() = id);
   
   CREATE POLICY "Users can update their own profile" ON users
     FOR UPDATE USING (auth.uid() = id);
   ```

## Step 5: Deploy and Test

### 5.1 Deploy to Netlify

1. **Commit and Push Changes**:
   ```bash
   git add .
   git commit -m "Add performance optimizations"
   git push origin main
   ```

2. **Monitor Deployment**:
   - Go to your Netlify dashboard
   - Check the **Deploys** tab
   - Verify the build completes successfully

### 5.2 Test Performance

1. **Test Loading Times**:
   - Open your site in an incognito window
   - Use browser dev tools to measure loading times
   - Test both logged-in and logged-out states

2. **Verify Caching**:
   - Check browser dev tools → Network tab
   - Verify static assets are cached (Cache-Control headers)
   - Test page reloads to ensure faster subsequent loads

3. **Monitor Errors**:
   - Check browser console for any errors
   - Verify Supabase connections are working
   - Test authentication flows

## Step 6: Monitoring and Maintenance

### 6.1 Set Up Monitoring

1. **Netlify Analytics**:
   - Enable **Analytics** in your Netlify dashboard
   - Monitor page load times and user engagement

2. **Supabase Monitoring**:
   - Go to **Dashboard** → **Logs** in Supabase
   - Monitor API request performance
   - Check for any connection issues

### 6.2 Performance Metrics to Track

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Initial Load Time | < 3 seconds | Browser dev tools |
| Time to Interactive | < 5 seconds | Lighthouse audit |
| Bundle Size | < 500KB | Build output |
| Database Query Time | < 100ms | Supabase logs |

## Troubleshooting

### Common Issues

1. **Environment Variables Not Set**:
   - Verify variables in Netlify dashboard
   - Check variable names match exactly
   - Redeploy after adding variables

2. **CORS Errors**:
   - Add your domain to Supabase CORS settings
   - Check for typos in domain names
   - Verify HTTPS is used

3. **Authentication Issues**:
   - Check redirect URLs in Supabase
   - Verify site URL settings
   - Test auth flow in incognito mode

4. **Slow Loading**:
   - Check browser dev tools for large requests
   - Verify caching headers are set
   - Monitor database query performance

### Performance Checklist

- [ ] Netlify headers configured
- [ ] Vite build optimized
- [ ] Supabase client optimized
- [ ] Environment variables set
- [ ] CORS origins configured
- [ ] Database indexes added (optional)
- [ ] RLS policies enabled (optional)
- [ ] Performance tested
- [ ] Monitoring enabled

## Expected Results

After implementing these changes, you should see:

1. **Faster Initial Load**: 2-5 seconds instead of 10-15 seconds
2. **Better Caching**: Static assets cached for 1 year
3. **Optimized Bundles**: Smaller, split JavaScript chunks
4. **Improved Database Performance**: Faster queries and connections
5. **Better User Experience**: Direct dashboard access for logged-in users

## Support

If you encounter issues:

1. Check the browser console for errors
2. Review Netlify deployment logs
3. Check Supabase dashboard for connection issues
4. Verify all environment variables are set correctly
5. Test in incognito mode to rule out caching issues

The optimizations should significantly improve your application's performance and user experience!