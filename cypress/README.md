# Cypress E2E Testing with Real Supabase Database

This directory contains comprehensive integration and E2E tests using Cypress with real Supabase test database.

## Test Categories

### 1. Complete User Workflow Testing (`userWorkflow.cy.ts`)
- **New user signup** through first application creation
- **Application lifecycle** from creation to offer/rejection
- **Company management** and multiple application scenarios
- **User profile updates** and preference changes

### 2. Data Consistency Testing (`dataConsistency.cy.ts`)
- **Multi-user scenarios** with shared company data
- **Concurrent application updates** and conflict resolution
- **Timeline accuracy** across status changes
- **Data synchronization** between components

### 3. Security and Permission Testing (`securityPermissions.cy.ts`)
- **User data isolation** and privacy validation
- **Authentication requirement** enforcement
- **CORS and API security** validation
- **Input sanitization** and XSS prevention

### 4. Production Environment Testing (`productionEnvironment.cy.ts`)
- **Staging environment** smoke tests
- **Production deployment** validation
- **Environment variable** and configuration testing
- **Database migration** and rollback testing

## Test Configuration

### Cypress Configuration (`cypress.config.ts`)
- **Base URL**: `http://localhost:5173`
- **Viewport**: 1280x720
- **Video recording**: Enabled
- **Retries**: 2 for run mode, 0 for open mode
- **Environment variables**: Supabase test credentials
- **Custom tasks**: Data cleanup and seeding

### Environment Variables
```bash
# Supabase test environment
VITE_SUPABASE_URL=https://your-test-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-test-anon-key

# Test user credentials
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=testpassword123

# Test data
TEST_COMPANY_NAME=Test Company
TEST_JOB_TITLE=Software Engineer
```

## Running Tests

### Basic Commands
```bash
# Run all Cypress tests
npm run test:cypress

# Open Cypress Test Runner (interactive)
npm run test:cypress:open

# Run tests in headed mode (see browser)
npm run test:cypress:headed

# Run tests for specific environment
npm run test:cypress:staging
npm run test:cypress:production
```

### Running Specific Tests
```bash
# Run only user workflow tests
npx cypress run --spec "cypress/e2e/userWorkflow.cy.ts"

# Run only data consistency tests
npx cypress run --spec "cypress/e2e/dataConsistency.cy.ts"

# Run only security tests
npx cypress run --spec "cypress/e2e/securityPermissions.cy.ts"

# Run only production environment tests
npx cypress run --spec "cypress/e2e/productionEnvironment.cy.ts"
```

### Running with Different Browsers
```bash
# Run tests in Chrome
npx cypress run --browser chrome

# Run tests in Firefox
npx cypress run --browser firefox

# Run tests in Edge
npx cypress run --browser edge
```

## Test Structure

### User Workflow Tests
- **New User Signup**: Complete signup flow with validation
- **Application Lifecycle**: Full application journey from creation to completion
- **Company Management**: Multi-application scenarios and company data sharing
- **Profile Updates**: User preference changes and account management

### Data Consistency Tests
- **Multi-User Scenarios**: Shared company data with user isolation
- **Concurrent Updates**: Conflict resolution and data integrity
- **Timeline Accuracy**: Status change tracking and history
- **Data Synchronization**: Real-time updates across components

### Security and Permission Tests
- **User Data Isolation**: Privacy validation and data boundaries
- **Authentication Enforcement**: Route protection and session management
- **CORS Validation**: Cross-origin request handling
- **Input Sanitization**: XSS prevention and data validation

### Production Environment Tests
- **Staging Smoke Tests**: Basic functionality validation
- **Production Validation**: Deployment verification and performance
- **Environment Configuration**: Variable testing and setup validation
- **Database Migrations**: Schema changes and rollback testing

## Custom Commands

### Authentication Commands
```typescript
// Login with test user
cy.login('user@example.com', 'password');

// Check authentication state
cy.checkAuthState(true); // Should be authenticated
cy.checkAuthState(false); // Should not be authenticated
```

### Data Management Commands
```typescript
// Create test application
cy.createTestApplication('Job Title', 'Company Name');

// Clean up test data
cy.cleanupTestData();

// Seed test data
cy.seedTestData();

// Wait for Supabase operations
cy.waitForSupabase();
```

### Data Consistency Commands
```typescript
// Check data consistency
cy.checkDataConsistency();

// Test user isolation
cy.checkUserIsolation();

// Test concurrent operations
cy.testConcurrentOperations();
```

### Security Commands
```typescript
// Test security features
cy.testSecurityFeatures();

// Test production environment
cy.testProductionEnvironment();

// Test database migrations
cy.testDatabaseMigrations();
```

## Test Data Attributes

The tests use the following `data-testid` attributes:

### Authentication Elements
- `login-form`: Login form container
- `signup-form`: Signup form container
- `email-input`: Email input field
- `password-input`: Password input field
- `login-button`: Login submit button
- `signup-button`: Signup submit button
- `logout-button`: Logout button

### Application Elements
- `add-application`: Add application button
- `application-form`: Application form container
- `job-title-input`: Job title input field
- `company-name-input`: Company name input field
- `submit-form`: Form submit button
- `application-list`: Application list container
- `application-card`: Individual application card

### Navigation Elements
- `nav-links`: Navigation links container
- `user-menu`: User menu dropdown
- `profile-link`: Profile navigation link
- `preferences-link`: Preferences navigation link

### Status Indicators
- `error-message`: Error message display
- `success-message`: Success message display
- `loading-indicator`: Loading state indicator
- `offline-indicator`: Offline status indicator

## Database Integration

### Supabase Test Database
- **Test Environment**: Separate test database for E2E tests
- **Data Isolation**: Tests run in isolated environment
- **Cleanup**: Automatic data cleanup after each test
- **Seeding**: Test data seeding for consistent scenarios

### Database Operations
```typescript
// Test database connectivity
cy.request({
  url: '/api/health/database',
  method: 'GET'
}).then((response) => {
  expect(response.status).to.equal(200);
  expect(response.body.status).to.equal('connected');
});

// Test data persistence
cy.createTestApplication('Test Job', 'Test Company');
cy.reload();
cy.get('[data-testid="application-list"]').should('contain', 'Test Job');
```

## Continuous Integration

### GitHub Actions Example
```yaml
name: Cypress E2E Tests
on: [push, pull_request]
jobs:
  cypress-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run test:cypress
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: cypress-screenshots
          path: cypress/screenshots/
```

### Environment-Specific Testing
```bash
# Staging environment tests
npm run test:cypress:staging

# Production environment tests
npm run test:cypress:production

# Local development tests
npm run test:cypress
```

## Best Practices

### Test Organization
- Group related tests using `describe()` blocks
- Use descriptive test names
- Keep tests independent and isolated
- Use `beforeEach()` for common setup

### Data Management
- Clean up test data after each test
- Use isolated test databases
- Seed consistent test data
- Avoid test interdependencies

### Security Testing
- Test authentication requirements
- Validate data isolation
- Check input sanitization
- Verify CORS policies

### Performance Testing
- Monitor test execution time
- Test with realistic data volumes
- Validate response times
- Check memory usage

## Debugging Tests

### Common Issues
1. **Element not found**: Check if `data-testid` attributes are present
2. **Timing issues**: Add appropriate `waitFor` calls
3. **Database connectivity**: Verify Supabase configuration
4. **Authentication issues**: Check test user credentials

### Debug Commands
```bash
# Run single test with debug
npx cypress run --spec "cypress/e2e/userWorkflow.cy.ts" --headed

# Open Cypress Test Runner
npx cypress open

# Run with verbose logging
npx cypress run --config video=false --screenshot=false
```

## Test Coverage Summary

### User Workflow Tests: 15 tests
- New user signup and validation
- Application lifecycle management
- Company management scenarios
- User profile updates

### Data Consistency Tests: 12 tests
- Multi-user data isolation
- Concurrent update handling
- Timeline accuracy validation
- Data synchronization

### Security Tests: 16 tests
- User data privacy validation
- Authentication enforcement
- CORS and API security
- Input sanitization

### Production Environment Tests: 14 tests
- Staging smoke tests
- Production validation
- Environment configuration
- Database migration testing

**Total: 57 comprehensive E2E tests** covering all major application workflows, data integrity, security, and production deployment scenarios. 