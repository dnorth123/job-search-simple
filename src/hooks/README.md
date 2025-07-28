# React Hooks Documentation

## useBetaValidation

A React hook for managing beta invite validation during user registration.

### Features

- ✅ Validates email addresses against the `beta_invites` table
- ✅ Case-insensitive email matching
- ✅ Checks for already-used invites
- ✅ Validates invite expiration dates
- ✅ Marks invites as used after successful registration
- ✅ Comprehensive error handling and loading states
- ✅ TypeScript support with full type safety

### Usage

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

  const handleRegistrationComplete = async (email: string) => {
    const success = await markBetaInviteUsed(email);
    
    if (success) {
      console.log('Registration completed successfully');
    } else {
      console.error('Failed to mark invite as used');
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

### API Reference

#### Return Values

| Property | Type | Description |
|----------|------|-------------|
| `isLoading` | `boolean` | Loading state for async operations |
| `error` | `string \| null` | Current error message |
| `validateBetaAccess` | `(email: string) => Promise<BetaValidationResult>` | Validates beta access for an email |
| `markBetaInviteUsed` | `(email: string) => Promise<boolean>` | Marks a beta invite as used |
| `clearError` | `() => void` | Clears the current error state |

#### BetaValidationResult

```typescript
interface BetaValidationResult {
  isValid: boolean;
  error?: string;
  invite?: BetaInvite;
}
```

#### BetaInvite

```typescript
interface BetaInvite {
  id: string;
  email: string;
  used_at: string | null;
  created_at: string;
  expires_at?: string;
}
```

### Error Scenarios

The hook handles the following error scenarios:

1. **Empty Email**: Returns "Email is required"
2. **Email Not Found**: Returns "This email is not on our beta invite list. Please contact support for access."
3. **Already Used**: Returns "This beta invite has already been used. Please contact support for a new invite."
4. **Expired Invite**: Returns "This beta invite has expired. Please contact support for a new invite."
5. **Database Error**: Returns "Unable to validate beta access. Please try again."

### Database Schema

The hook expects a `beta_invites` table with the following structure:

```sql
CREATE TABLE beta_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    invited_by VARCHAR(255),
    notes TEXT
);
```

### Testing

The hook includes comprehensive tests covering:

- ✅ Email validation scenarios
- ✅ Database error handling
- ✅ Loading state management
- ✅ Error clearing functionality
- ✅ Case-insensitive email matching
- ✅ Expiration date validation

Run tests with:
```bash
npm test useBetaValidation
```

### Example Component

See `src/components/BetaValidationExample.tsx` for a complete implementation example.

### Migration

To set up the required database table, run the migration in `src/database/beta_invites_migration.sql`. 