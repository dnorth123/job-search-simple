# Beta Sync Setup Guide

This guide explains how to set up and use the beta invite synchronization system.

## Overview

The beta sync system consists of:
- `useBetaValidation` React hook for frontend validation
- `sync-beta-list.js` Node.js script for backend synchronization
- `beta_invites` database table for storing invite data

## Quick Start

### 1. Database Setup

Run the migration to create the `beta_invites` table:

```sql
-- Run this in your Supabase SQL editor
-- Or use the migration file: src/database/beta_invites_migration.sql
```

### 2. Environment Configuration

Set up your environment variables:

```bash
# Required for the sync script
export NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Or create a .env file
echo "NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co" > .env
echo "SUPABASE_SERVICE_ROLE_KEY=your-service-role-key" >> .env
```

### 3. Beta List File

Create or update `beta-list.txt` in the project root:

```txt
# Beta Invite List - Knowledge Worker Job Tracker
# Add one email per line, comments start with #

dan.northington@gmail.com
test@example.com
beta.user@company.com
```

### 4. Test the Setup

Test the parsing and environment configuration:

```bash
npm run test:sync
```

### 5. Run the Sync

Synchronize emails to the database:

```bash
npm run sync:beta
```

## Usage in React Components

### Basic Usage

```typescript
import { useBetaValidation } from './hooks/useBetaValidation';

function RegistrationForm() {
  const {
    isLoading,
    error,
    validateBetaAccess,
    markBetaInviteUsed,
    clearError
  } = useBetaValidation();

  const handleEmailValidation = async (email: string) => {
    const result = await validateBetaAccess(email);
    
    if (result.isValid) {
      // Proceed with registration
      console.log('Valid beta invite:', result.invite);
    } else {
      // Show error message
      console.error('Validation failed:', result.error);
    }
  };

  return (
    <div>
      {isLoading && <div>Validating...</div>}
      {error && <div className="error">{error}</div>}
      {/* Your form components */}
    </div>
  );
}
```

### Complete Example

See `src/components/BetaValidationExample.tsx` for a full implementation example.

## Script Commands

| Command | Description |
|---------|-------------|
| `npm run test:sync` | Test parsing and environment setup |
| `npm run sync:beta` | Sync emails from beta-list.txt to database |

## File Structure

```
project-root/
├── beta-list.txt                    # Email list (one per line)
├── scripts/
│   ├── sync-beta-list.js           # Main sync script
│   ├── test-sync.js                # Test script
│   └── README.md                   # Script documentation
├── src/
│   ├── hooks/
│   │   └── useBetaValidation.ts    # React hook
│   ├── components/
│   │   └── BetaValidationExample.tsx # Usage example
│   └── database/
│       └── beta_invites_migration.sql # Database schema
```

## Error Scenarios

### Common Issues

1. **Missing Environment Variables**
   ```
   ❌ Missing NEXT_PUBLIC_SUPABASE_URL environment variable
   ```
   **Solution**: Set the required environment variables

2. **File Not Found**
   ```
   ❌ Beta list file not found: /path/to/beta-list.txt
   ```
   **Solution**: Create `beta-list.txt` in the project root

3. **Invalid Email Format**
   ```
   ⚠️ Invalid email format on line 5: invalid-email
   ```
   **Solution**: Fix email format in `beta-list.txt`

4. **Database Connection Error**
   ```
   ❌ Failed to check existing emails: connection error
   ```
   **Solution**: Check Supabase URL and service role key

### Troubleshooting

1. **Test the setup first**:
   ```bash
   npm run test:sync
   ```

2. **Check environment variables**:
   ```bash
   echo $NEXT_PUBLIC_SUPABASE_URL
   echo $SUPABASE_SERVICE_ROLE_KEY
   ```

3. **Verify beta-list.txt format**:
   ```bash
   cat beta-list.txt
   ```

4. **Check database connection**:
   - Verify Supabase project is active
   - Confirm service role key has proper permissions
   - Ensure `beta_invites` table exists

## Security Considerations

- **Service Role Key**: Keep the service role key secure and never commit it to version control
- **Environment Variables**: Use `.env` files for local development, environment variables for production
- **Database Permissions**: The service role key should have minimal required permissions
- **Email Validation**: The script validates email formats but doesn't verify email existence

## Performance Notes

- **Batch Processing**: Emails are processed in batches of 50 to avoid query limits
- **Duplicate Prevention**: Checks existing emails before inserting
- **Case Insensitive**: All emails are normalized to lowercase
- **Error Handling**: Continues processing even if some emails fail

## Monitoring

The sync script provides detailed output including:
- Number of emails processed
- Number of new emails inserted
- Number of existing emails skipped
- Any errors encountered

Example output:
```
🚀 Starting Beta List Sync

✅ Environment variables validated
✅ Supabase client initialized
🔄 Reading beta-list.txt...
✅ Found 3 valid email addresses
🔄 Checking for existing emails in database...
ℹ️ Found 1 existing emails in database
🔄 Inserting 2 new emails...
✅ Successfully synced 2 new beta invites

📊 Sync Summary
Total emails in file: 3
Existing emails: 1
New emails inserted: 2
```

## Integration with CI/CD

For automated deployments, you can add the sync script to your CI/CD pipeline:

```yaml
# Example GitHub Actions step
- name: Sync Beta List
  run: npm run sync:beta
  env:
    NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
    SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
``` 