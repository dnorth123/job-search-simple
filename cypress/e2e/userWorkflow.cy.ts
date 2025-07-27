describe('Complete User Workflow Testing', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.cleanupTestData();
  });

  afterEach(() => {
    cy.cleanupTestData();
  });

  describe('New User Signup Through First Application Creation', () => {
    it('should complete new user signup and create first application', () => {
      // Start with signup
      cy.get('[data-testid="signup-link"]').click();
      cy.get('[data-testid="signup-form"]').should('be.visible');
      
      // Fill signup form
      const testEmail = `test-${Date.now()}@example.com`;
      const testPassword = 'TestPassword123!';
      
      cy.get('[data-testid="email-input"]').type(testEmail);
      cy.get('[data-testid="password-input"]').type(testPassword);
      cy.get('[data-testid="confirm-password-input"]').type(testPassword);
      cy.get('[data-testid="signup-button"]').click();
      
      // Wait for successful signup and redirect
      cy.url().should('include', '/dashboard');
      cy.get('[data-testid="welcome-message"]').should('be.visible');
      
      // Create first application
      cy.get('[data-testid="add-application"]').click();
      cy.get('[data-testid="application-form"]').should('be.visible');
      
      // Fill application form
      cy.get('[data-testid="job-title-input"]').type('Software Engineer');
      cy.get('[data-testid="company-name-input"]').type('Tech Startup Inc');
      cy.get('[data-testid="job-description-input"]').type('Exciting opportunity to work on cutting-edge technology');
      cy.get('[data-testid="salary-input"]').type('80000');
      cy.get('[data-testid="location-input"]').type('San Francisco, CA');
      
      // Submit form
      cy.get('[data-testid="submit-form"]').click();
      
      // Verify application was created
      cy.get('[data-testid="application-list"]').should('contain', 'Software Engineer');
      cy.get('[data-testid="application-list"]').should('contain', 'Tech Startup Inc');
      
      // Verify timeline entry was created
      cy.get('[data-testid="timeline-entry"]').should('contain', 'Application created');
    });

    it('should handle signup validation errors', () => {
      cy.get('[data-testid="signup-link"]').click();
      
      // Test invalid email
      cy.get('[data-testid="email-input"]').type('invalid-email');
      cy.get('[data-testid="password-input"]').type('password');
      cy.get('[data-testid="signup-button"]').click();
      cy.get('[data-testid="email-error"]').should('be.visible');
      
      // Test weak password
      cy.get('[data-testid="email-input"]').clear().type('test@example.com');
      cy.get('[data-testid="password-input"]').clear().type('123');
      cy.get('[data-testid="signup-button"]').click();
      cy.get('[data-testid="password-error"]').should('be.visible');
      
      // Test password mismatch
      cy.get('[data-testid="password-input"]').clear().type('StrongPassword123!');
      cy.get('[data-testid="confirm-password-input"]').type('DifferentPassword123!');
      cy.get('[data-testid="signup-button"]').click();
      cy.get('[data-testid="confirm-password-error"]').should('be.visible');
    });

    it('should handle duplicate email signup', () => {
      // First signup
      cy.get('[data-testid="signup-link"]').click();
      cy.get('[data-testid="email-input"]').type('duplicate@example.com');
      cy.get('[data-testid="password-input"]').type('Password123!');
      cy.get('[data-testid="confirm-password-input"]').type('Password123!');
      cy.get('[data-testid="signup-button"]').click();
      
      // Wait for first signup to complete
      cy.url().should('include', '/dashboard');
      
      // Logout
      cy.get('[data-testid="logout-button"]').click();
      
      // Try to signup with same email
      cy.get('[data-testid="signup-link"]').click();
      cy.get('[data-testid="email-input"]').type('duplicate@example.com');
      cy.get('[data-testid="password-input"]').type('Password123!');
      cy.get('[data-testid="confirm-password-input"]').type('Password123!');
      cy.get('[data-testid="signup-button"]').click();
      
      // Should show error
      cy.get('[data-testid="signup-error"]').should('be.visible');
    });
  });

  describe('Application Lifecycle from Creation to Offer/Rejection', () => {
    beforeEach(() => {
      cy.login(Cypress.env('TEST_USER_EMAIL'), Cypress.env('TEST_USER_PASSWORD'));
    });

    it('should complete full application lifecycle', () => {
      // Create application
      cy.createTestApplication('Senior Developer', 'Tech Corp');
      
      // Update application status to "Applied"
      cy.get('[data-testid="application-card"]').first().click();
      cy.get('[data-testid="status-select"]').select('Applied');
      cy.get('[data-testid="save-status"]').click();
      
      // Verify timeline entry
      cy.get('[data-testid="timeline-entry"]').should('contain', 'Status updated to Applied');
      
      // Update to "Interview Scheduled"
      cy.get('[data-testid="status-select"]').select('Interview Scheduled');
      cy.get('[data-testid="interview-date-input"]').type('2024-02-15');
      cy.get('[data-testid="save-status"]').click();
      
      // Verify timeline entry
      cy.get('[data-testid="timeline-entry"]').should('contain', 'Interview scheduled');
      
      // Update to "Interview Completed"
      cy.get('[data-testid="status-select"]').select('Interview Completed');
      cy.get('[data-testid="interview-notes-input"]').type('Great interview, waiting for feedback');
      cy.get('[data-testid="save-status"]').click();
      
      // Update to "Offer Received"
      cy.get('[data-testid="status-select"]').select('Offer Received');
      cy.get('[data-testid="offer-salary-input"]').type('95000');
      cy.get('[data-testid="offer-notes-input"]').type('Excellent offer with great benefits');
      cy.get('[data-testid="save-status"]').click();
      
      // Verify final timeline
      cy.get('[data-testid="timeline-entry"]').should('contain', 'Offer received');
      cy.get('[data-testid="application-status"]').should('contain', 'Offer Received');
    });

    it('should handle application rejection', () => {
      // Create application
      cy.createTestApplication('Frontend Developer', 'Startup Inc');
      
      // Update to "Applied"
      cy.get('[data-testid="application-card"]').first().click();
      cy.get('[data-testid="status-select"]').select('Applied');
      cy.get('[data-testid="save-status"]').click();
      
      // Update to "Rejected"
      cy.get('[data-testid="status-select"]').select('Rejected');
      cy.get('[data-testid="rejection-reason-input"]').type('Position filled internally');
      cy.get('[data-testid="save-status"]').click();
      
      // Verify rejection
      cy.get('[data-testid="application-status"]').should('contain', 'Rejected');
      cy.get('[data-testid="timeline-entry"]').should('contain', 'Application rejected');
    });

    it('should handle application withdrawal', () => {
      // Create application
      cy.createTestApplication('Backend Developer', 'Enterprise Corp');
      
      // Update to "Applied"
      cy.get('[data-testid="application-card"]').first().click();
      cy.get('[data-testid="status-select"]').select('Applied');
      cy.get('[data-testid="save-status"]').click();
      
      // Withdraw application
      cy.get('[data-testid="withdraw-button"]').click();
      cy.get('[data-testid="withdrawal-reason-input"]').type('Accepted another offer');
      cy.get('[data-testid="confirm-withdrawal"]').click();
      
      // Verify withdrawal
      cy.get('[data-testid="application-status"]').should('contain', 'Withdrawn');
      cy.get('[data-testid="timeline-entry"]').should('contain', 'Application withdrawn');
    });

    it('should track application metrics correctly', () => {
      // Create multiple applications with different statuses
      cy.createTestApplication('Job 1', 'Company A');
      cy.createTestApplication('Job 2', 'Company B');
      cy.createTestApplication('Job 3', 'Company C');
      
      // Update statuses
      cy.get('[data-testid="application-card"]').eq(0).click();
      cy.get('[data-testid="status-select"]').select('Applied');
      cy.get('[data-testid="save-status"]').click();
      cy.go('back');
      
      cy.get('[data-testid="application-card"]').eq(1).click();
      cy.get('[data-testid="status-select"]').select('Offer Received');
      cy.get('[data-testid="save-status"]').click();
      cy.go('back');
      
      cy.get('[data-testid="application-card"]').eq(2).click();
      cy.get('[data-testid="status-select"]').select('Rejected');
      cy.get('[data-testid="save-status"]').click();
      cy.go('back');
      
      // Check metrics
      cy.get('[data-testid="total-applications"]').should('contain', '3');
      cy.get('[data-testid="applied-count"]').should('contain', '1');
      cy.get('[data-testid="offers-count"]').should('contain', '1');
      cy.get('[data-testid="rejections-count"]').should('contain', '1');
    });
  });

  describe('Company Management and Multiple Application Scenarios', () => {
    beforeEach(() => {
      cy.login(Cypress.env('TEST_USER_EMAIL'), Cypress.env('TEST_USER_PASSWORD'));
    });

    it('should handle multiple applications to same company', () => {
      // Create first application
      cy.createTestApplication('Software Engineer', 'Tech Corp');
      
      // Create second application to same company
      cy.get('[data-testid="add-application"]').click();
      cy.get('[data-testid="job-title-input"]').type('Senior Engineer');
      cy.get('[data-testid="company-name-input"]').type('Tech Corp');
      cy.get('[data-testid="submit-form"]').click();
      
      // Verify both applications exist
      cy.get('[data-testid="application-list"]').should('contain', 'Software Engineer');
      cy.get('[data-testid="application-list"]').should('contain', 'Senior Engineer');
      
      // Check company grouping
      cy.get('[data-testid="company-group"]').should('contain', 'Tech Corp');
      cy.get('[data-testid="company-application-count"]').should('contain', '2');
    });

    it('should handle company autocomplete', () => {
      // Create first application
      cy.createTestApplication('Developer', 'Microsoft');
      
      // Create second application and test autocomplete
      cy.get('[data-testid="add-application"]').click();
      cy.get('[data-testid="company-name-input"]').type('Micro');
      
      // Should show autocomplete suggestions
      cy.get('[data-testid="company-suggestions"]').should('be.visible');
      cy.get('[data-testid="company-suggestion"]').first().click();
      
      // Verify company name was filled
      cy.get('[data-testid="company-name-input"]').should('have.value', 'Microsoft');
    });

    it('should handle company data consistency', () => {
      // Create applications with slight company name variations
      cy.createTestApplication('Job 1', 'Google Inc');
      cy.createTestApplication('Job 2', 'Google');
      cy.createTestApplication('Job 3', 'Google LLC');
      
      // Check that company is properly deduplicated
      cy.get('[data-testid="company-list"]').should('contain', 'Google');
      cy.get('[data-testid="company-application-count"]').should('contain', '3');
    });

    it('should handle company contact information', () => {
      // Create application
      cy.createTestApplication('Developer', 'Contact Corp');
      
      // Add company contact information
      cy.get('[data-testid="application-card"]').first().click();
      cy.get('[data-testid="edit-company-info"]').click();
      cy.get('[data-testid="company-email-input"]').type('hr@contactcorp.com');
      cy.get('[data-testid="company-phone-input"]').type('555-123-4567');
      cy.get('[data-testid="company-website-input"]').type('https://contactcorp.com');
      cy.get('[data-testid="save-company-info"]').click();
      
      // Verify contact information is saved
      cy.get('[data-testid="company-email"]').should('contain', 'hr@contactcorp.com');
      cy.get('[data-testid="company-phone"]').should('contain', '555-123-4567');
    });
  });

  describe('User Profile Updates and Preference Changes', () => {
    beforeEach(() => {
      cy.login(Cypress.env('TEST_USER_EMAIL'), Cypress.env('TEST_USER_PASSWORD'));
    });

    it('should update user profile information', () => {
      // Navigate to profile
      cy.get('[data-testid="user-menu"]').click();
      cy.get('[data-testid="profile-link"]').click();
      
      // Update profile information
      cy.get('[data-testid="edit-profile"]').click();
      cy.get('[data-testid="first-name-input"]').clear().type('John');
      cy.get('[data-testid="last-name-input"]').clear().type('Doe');
      cy.get('[data-testid="phone-input"]').clear().type('555-987-6543');
      cy.get('[data-testid="location-input"]').clear().type('New York, NY');
      cy.get('[data-testid="bio-input"]').clear().type('Experienced software engineer');
      cy.get('[data-testid="save-profile"]').click();
      
      // Verify profile was updated
      cy.get('[data-testid="profile-name"]').should('contain', 'John Doe');
      cy.get('[data-testid="profile-phone"]').should('contain', '555-987-6543');
      cy.get('[data-testid="profile-location"]').should('contain', 'New York, NY');
    });

    it('should update user preferences', () => {
      // Navigate to preferences
      cy.get('[data-testid="user-menu"]').click();
      cy.get('[data-testid="preferences-link"]').click();
      
      // Update preferences
      cy.get('[data-testid="email-notifications"]').check();
      cy.get('[data-testid="salary-display"]').select('Show');
      cy.get('[data-testid="timeline-notifications"]').check();
      cy.get('[data-testid="save-preferences"]').click();
      
      // Verify preferences were saved
      cy.get('[data-testid="success-message"]').should('be.visible');
      
      // Test that preferences are applied
      cy.visit('/dashboard');
      cy.get('[data-testid="application-card"]').first().click();
      cy.get('[data-testid="salary-display"]').should('be.visible');
    });

    it('should handle password change', () => {
      // Navigate to security settings
      cy.get('[data-testid="user-menu"]').click();
      cy.get('[data-testid="security-link"]').click();
      
      // Change password
      cy.get('[data-testid="current-password-input"]').type(Cypress.env('TEST_USER_PASSWORD'));
      cy.get('[data-testid="new-password-input"]').type('NewPassword123!');
      cy.get('[data-testid="confirm-new-password-input"]').type('NewPassword123!');
      cy.get('[data-testid="change-password-button"]').click();
      
      // Verify password was changed
      cy.get('[data-testid="success-message"]').should('be.visible');
      
      // Test login with new password
      cy.get('[data-testid="logout-button"]').click();
      cy.login(Cypress.env('TEST_USER_EMAIL'), 'NewPassword123!');
      cy.get('[data-testid="dashboard"]').should('be.visible');
    });

    it('should handle account deletion', () => {
      // Navigate to account settings
      cy.get('[data-testid="user-menu"]').click();
      cy.get('[data-testid="account-link"]').click();
      
      // Initiate account deletion
      cy.get('[data-testid="delete-account-button"]').click();
      cy.get('[data-testid="confirm-deletion-input"]').type('DELETE');
      cy.get('[data-testid="confirm-deletion-button"]').click();
      
      // Verify account was deleted
      cy.url().should('include', '/login');
      cy.get('[data-testid="account-deleted-message"]').should('be.visible');
      
      // Verify cannot login with deleted account
      cy.login(Cypress.env('TEST_USER_EMAIL'), Cypress.env('TEST_USER_PASSWORD'));
      cy.get('[data-testid="login-error"]').should('be.visible');
    });
  });
}); 