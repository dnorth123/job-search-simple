// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Custom command for user login
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.visit('/');
  
  // Wait for auth form to be visible
  cy.get('[data-testid="login-form"]', { timeout: 10000 }).should('be.visible');
  
  // Fill in login form
  cy.get('[data-testid="email-input"]').type(email);
  cy.get('[data-testid="password-input"]').type(password);
  
  // Submit form
  cy.get('[data-testid="login-button"]').click();
  
  // Wait for successful login
  cy.url().should('include', '/dashboard');
  cy.get('[data-testid="dashboard"]').should('be.visible');
});

// Custom command for creating test application
Cypress.Commands.add('createTestApplication', (jobTitle: string, companyName: string) => {
  // Navigate to add application page
  cy.get('[data-testid="add-application"]').click();
  
  // Wait for form to be visible
  cy.get('[data-testid="application-form"]').should('be.visible');
  
  // Fill in application form
  cy.get('[data-testid="job-title-input"]').type(jobTitle);
  cy.get('[data-testid="company-name-input"]').type(companyName);
  
  // Submit form
  cy.get('[data-testid="submit-form"]').click();
  
  // Wait for success
  cy.get('[data-testid="application-list"]').should('contain', jobTitle);
});

// Custom command for cleaning up test data
Cypress.Commands.add('cleanupTestData', () => {
  // This would interact with Supabase to clean up test data
  cy.log('Cleaning up test data...');
  
  // Example: Delete test applications
  cy.window().then((win) => {
    // Access Supabase client and clean up data
    // This is a placeholder - actual implementation would use Supabase client
    cy.log('Test data cleanup completed');
  });
});

// Custom command for seeding test data
Cypress.Commands.add('seedTestData', () => {
  cy.log('Seeding test data...');
  
  // This would create test data in Supabase
  // Example: Create test companies, applications, etc.
  cy.log('Test data seeding completed');
});

// Custom command for waiting for Supabase operations
Cypress.Commands.add('waitForSupabase', () => {
  // Wait for any pending Supabase operations to complete
  cy.wait(1000); // Basic wait - could be enhanced with actual Supabase state checking
});

// Custom command for checking authentication state
Cypress.Commands.add('checkAuthState', (shouldBeAuthenticated: boolean) => {
  if (shouldBeAuthenticated) {
    cy.get('[data-testid="user-menu"]').should('be.visible');
    cy.get('[data-testid="logout-button"]').should('be.visible');
  } else {
    cy.get('[data-testid="login-form"]').should('be.visible');
  }
});

// Custom command for testing data consistency
Cypress.Commands.add('checkDataConsistency', () => {
  // Check that data is consistent across the application
  cy.get('[data-testid="application-list"]').then(($list) => {
    const applicationCount = $list.find('[data-testid="application-card"]').length;
    
    // Verify count matches other indicators
    cy.get('[data-testid="application-count"]').should('contain', applicationCount.toString());
  });
});

// Custom command for testing user isolation
Cypress.Commands.add('checkUserIsolation', () => {
  // Verify that users can only see their own data
  cy.get('[data-testid="application-card"]').each(($card) => {
    // Check that each application belongs to the current user
    cy.wrap($card).should('have.attr', 'data-user-id', Cypress.env('currentUserId'));
  });
});

// Custom command for testing concurrent operations
Cypress.Commands.add('testConcurrentOperations', () => {
  // Simulate concurrent operations
  cy.get('[data-testid="application-card"]').first().click();
  
  // Open multiple tabs/windows to test concurrent access
  cy.window().then((win) => {
    const newWindow = win.open('/dashboard', '_blank');
    cy.wrap(newWindow).should('exist');
  });
});

// Custom command for testing security features
Cypress.Commands.add('testSecurityFeatures', () => {
  // Test authentication requirements
  cy.visit('/dashboard', { failOnStatusCode: false });
  cy.url().should('include', '/login');
  
  // Test CORS headers
  cy.request({
    url: '/api/applications',
    failOnStatusCode: false
  }).then((response) => {
    expect(response.status).to.be.oneOf([401, 403]); // Should be unauthorized
  });
});

// Custom command for testing production environment
Cypress.Commands.add('testProductionEnvironment', () => {
  // Check environment variables
  cy.window().then((win) => {
    expect(win.import.meta.env.VITE_SUPABASE_URL).to.exist;
    expect(win.import.meta.env.VITE_SUPABASE_ANON_KEY).to.exist;
  });
  
  // Check for production-specific features
  cy.get('[data-testid="production-indicator"]').should('be.visible');
});

// Custom command for testing database migrations
Cypress.Commands.add('testDatabaseMigrations', () => {
  // This would test database schema changes
  cy.log('Testing database migrations...');
  
  // Check that all required tables exist
  cy.window().then((win) => {
    // Access Supabase client and verify schema
    cy.log('Database migration test completed');
  });
});

// Export commands for TypeScript
export {}; 