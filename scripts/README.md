# Scripts

This directory contains utility scripts for the job search application.

## sync-beta-list.js

A Node.js script to synchronize email addresses from `beta-list.txt` to the Supabase `beta_invites` table.

### Features

- ✅ Reads emails from `beta-list.txt` (one per line)
- ✅ Ignores comments (lines starting with `#`)
- ✅ Filters out empty lines and invalid email formats
- ✅ Converts emails to lowercase for consistency
- ✅ Checks for existing emails to avoid duplicates
- ✅ Processes emails in batches for better performance
- ✅ Provides detailed console output with colored feedback
- ✅ Handles errors gracefully with proper exit codes

### Usage

#### Prerequisites

1. **Environment Variables**: Set the following environment variables:
   ```bash
   export NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
   export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
   ```

2. **Beta List File**: Ensure `beta-list.txt` exists in the project root with emails:
   ```txt
   # Beta Invite List - Knowledge Worker Job Tracker
   # Add one email per line, comments start with #
   
   dan.northington@gmail.com
   test@example.com
   beta.user@company.com
   ```

#### Running the Script

**Option 1: Using npm script**
```bash
npm run sync:beta
```

**Option 2: Direct execution**
```bash
node scripts/sync-beta-list.js
```

**Option 3: Executable (if made executable)**
```bash
./scripts/sync-beta-list.js
```

### Output Example

```
🚀 Starting Beta List Sync

✅ Environment variables validated
✅ Supabase client initialized
🔄 Reading beta-list.txt...
✅ Found 3 valid email addresses
🔄 Checking for existing emails in database...
ℹ️ Found 1 existing emails in database
🔄 Inserting 2 new emails...
🔄 Inserted batch 1/1
✅ Successfully synced 2 new beta invites

📊 Sync Summary
Total emails in file: 3
Existing emails: 1
New emails inserted: 2
```

### Error Handling

The script handles various error scenarios:

- **Missing Environment Variables**: Clear error messages for missing Supabase URL or service role key
- **File Not Found**: Graceful handling if `beta-list.txt` doesn't exist
- **Invalid Email Formats**: Warning messages for malformed emails (skipped)
- **Database Errors**: Detailed error reporting for database connection issues
- **Network Issues**: Proper error handling for network timeouts

### File Format

The `beta-list.txt` file should contain:

- One email address per line
- Comments starting with `#` (ignored)
- Empty lines (ignored)
- Valid email format required

Example:
```txt
# Beta Invite List
# Add emails below

user1@example.com
user2@company.com
# user3@test.com  # This line is ignored
user4@domain.org
```

### Performance

- **Batch Processing**: Emails are processed in batches of 50 to avoid query size limits
- **Duplicate Prevention**: Checks existing emails before inserting to avoid duplicates
- **Case Insensitive**: All emails are converted to lowercase for consistency

### Exit Codes

- `0`: Success
- `1`: Error (with detailed error message)

### Dependencies

- `@supabase/supabase-js`: Supabase client library
- Node.js built-in modules: `fs/promises`, `path`, `url`

### Security Notes

- Uses Supabase service role key for database access
- Validates environment variables before execution
- Handles sensitive data securely
- No logging of email addresses in error messages 