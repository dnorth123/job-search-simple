describe('Data Consistency Testing', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.cleanupTestData();
    cy.seedTestData();
  });

  afterEach(() => {
    cy.cleanupTestData();
  });

  describe('Multi-User Scenarios with Shared Company Data', () => {
    it('should handle multiple users accessing same company data', () => {
      // Login as first user
      cy.login('user1@example.com', 'password123');
      
      // Create application for shared company
      cy.createTestApplication('Software Engineer', 'Shared Company Inc');
      
      // Logout and login as second user
      cy.get('[data-testid="logout-button"]').click();
      cy.login('user2@example.com', 'password123');
      
      // Create application for same company
      cy.createTestApplication('Product Manager', 'Shared Company Inc');
      
      // Verify both users can see the company
      cy.get('[data-testid="company-list"]').should('contain', 'Shared Company Inc');
      
      // Verify company data is shared but user data is isolated
      cy.get('[data-testid="company-info"]').should('contain', 'Shared Company Inc');
      cy.get('[data-testid="application-list"]').should('contain', 'Product Manager');
      cy.get('[data-testid="application-list"]').should('not.contain', 'Software Engineer');
    });

    it('should handle company data updates across users', () => {
      // Login as first user and create company
      cy.login('user1@example.com', 'password123');
      cy.createTestApplication('Developer', 'Tech Corp');
      
      // Update company information
      cy.get('[data-testid="application-card"]').first().click();
      cy.get('[data-testid="edit-company-info"]').click();
      cy.get('[data-testid="company-website-input"]').type('https://techcorp.com');
      cy.get('[data-testid="save-company-info"]').click();
      
      // Logout and login as second user
      cy.get('[data-testid="logout-button"]').click();
      cy.login('user2@example.com', 'password123');
      
      // Create application for same company
      cy.createTestApplication('Designer', 'Tech Corp');
      
      // Verify company information is updated for second user
      cy.get('[data-testid="company-website"]').should('contain', 'https://techcorp.com');
    });

    it('should handle company name variations and deduplication', () => {
      // Login as first user
      cy.login('user1@example.com', 'password123');
      cy.createTestApplication('Engineer', 'Google Inc');
      
      // Logout and login as second user
      cy.get('[data-testid="logout-button"]').click();
      cy.login('user2@example.com', 'password123');
      cy.createTestApplication('Manager', 'Google');
      
      // Verify company deduplication
      cy.get('[data-testid="company-list"]').should('contain', 'Google');
      cy.get('[data-testid="company-application-count"]').should('contain', '2');
    });

    it('should handle user data isolation', () => {
      // Login as first user
      cy.login('user1@example.com', 'password123');
      cy.createTestApplication('Job 1', 'Company A');
      cy.createTestApplication('Job 2', 'Company B');
      
      // Logout and login as second user
      cy.get('[data-testid="logout-button"]').click();
      cy.login('user2@example.com', 'password123');
      cy.createTestApplication('Job 3', 'Company C');
      
      // Verify user data isolation
      cy.get('[data-testid="application-list"]').should('contain', 'Job 3');
      cy.get('[data-testid="application-list"]').should('not.contain', 'Job 1');
      cy.get('[data-testid="application-list"]').should('not.contain', 'Job 2');
      
      // Verify application count is correct
      cy.get('[data-testid="total-applications"]').should('contain', '1');
    });
  });

  describe('Concurrent Application Updates and Conflict Resolution', () => {
    it('should handle concurrent application status updates', () => {
      // Login and create application
      cy.login('user1@example.com', 'password123');
      cy.createTestApplication('Concurrent Job', 'Test Company');
      
      // Open application in multiple tabs
      cy.get('[data-testid="application-card"]').first().click();
      cy.window().then((win) => {
        // Open second tab
        const newWindow = win.open('/dashboard', '_blank');
        cy.wrap(newWindow).should('exist');
      });
      
      // Update status in first tab
      cy.get('[data-testid="status-select"]').select('Applied');
      cy.get('[data-testid="save-status"]').click();
      
      // Switch to second tab and try to update
      cy.window().then((win) => {
        win.focus();
        cy.get('[data-testid="application-card"]').first().click();
        cy.get('[data-testid="status-select"]').select('Interview Scheduled');
        cy.get('[data-testid="save-status"]').click();
        
        // Should handle conflict gracefully
        cy.get('[data-testid="conflict-resolution"]').should('be.visible');
      });
    });

    it('should handle concurrent company information updates', () => {
      // Login and create application
      cy.login('user1@example.com', 'password123');
      cy.createTestApplication('Job', 'Concurrent Company');
      
      // Open application in multiple tabs
      cy.get('[data-testid="application-card"]').first().click();
      cy.window().then((win) => {
        const newWindow = win.open('/dashboard', '_blank');
        cy.wrap(newWindow).should('exist');
      });
      
      // Update company info in first tab
      cy.get('[data-testid="edit-company-info"]').click();
      cy.get('[data-testid="company-email-input"]').type('hr@company.com');
      cy.get('[data-testid="save-company-info"]').click();
      
      // Try to update in second tab
      cy.window().then((win) => {
        win.focus();
        cy.get('[data-testid="application-card"]').first().click();
        cy.get('[data-testid="edit-company-info"]').click();
        cy.get('[data-testid="company-phone-input"]').type('555-123-4567');
        cy.get('[data-testid="save-company-info"]').click();
        
        // Should merge changes or show conflict
        cy.get('[data-testid="company-email"]').should('contain', 'hr@company.com');
        cy.get('[data-testid="company-phone"]').should('contain', '555-123-4567');
      });
    });

    it('should handle offline/online synchronization', () => {
      // Login and create application
      cy.login('user1@example.com', 'password123');
      cy.createTestApplication('Offline Job', 'Offline Company');
      
      // Go offline
      cy.window().then((win) => {
        cy.stub(win.navigator, 'onLine').value(false);
      });
      
      // Make changes while offline
      cy.get('[data-testid="application-card"]').first().click();
      cy.get('[data-testid="status-select"]').select('Applied');
      cy.get('[data-testid="save-status"]').click();
      
      // Should show offline indicator
      cy.get('[data-testid="offline-indicator"]').should('be.visible');
      
      // Go back online
      cy.window().then((win) => {
        cy.stub(win.navigator, 'onLine').value(true);
      });
      
      // Should sync changes
      cy.get('[data-testid="sync-indicator"]').should('be.visible');
      cy.get('[data-testid="application-status"]').should('contain', 'Applied');
    });

    it('should handle data validation conflicts', () => {
      // Login and create application
      cy.login('user1@example.com', 'password123');
      cy.createTestApplication('Validation Job', 'Validation Company');
      
      // Try to update with invalid data
      cy.get('[data-testid="application-card"]').first().click();
      cy.get('[data-testid="edit-application"]').click();
      cy.get('[data-testid="salary-input"]').clear().type('invalid-salary');
      cy.get('[data-testid="save-application"]').click();
      
      // Should show validation error
      cy.get('[data-testid="salary-error"]').should('be.visible');
      
      // Fix validation error
      cy.get('[data-testid="salary-input"]').clear().type('75000');
      cy.get('[data-testid="save-application"]').click();
      
      // Should save successfully
      cy.get('[data-testid="success-message"]').should('be.visible');
    });
  });

  describe('Timeline Accuracy Across Status Changes', () => {
    it('should maintain accurate timeline for status changes', () => {
      // Login and create application
      cy.login('user1@example.com', 'password123');
      cy.createTestApplication('Timeline Job', 'Timeline Company');
      
      // Get initial timestamp
      const initialTime = new Date().toISOString();
      
      // Update status multiple times
      cy.get('[data-testid="application-card"]').first().click();
      
      // First status change
      cy.get('[data-testid="status-select"]').select('Applied');
      cy.get('[data-testid="save-status"]').click();
      cy.get('[data-testid="timeline-entry"]').should('contain', 'Status updated to Applied');
      
      // Second status change
      cy.get('[data-testid="status-select"]').select('Interview Scheduled');
      cy.get('[data-testid="interview-date-input"]').type('2024-02-15');
      cy.get('[data-testid="save-status"]').click();
      cy.get('[data-testid="timeline-entry"]').should('contain', 'Interview scheduled');
      
      // Third status change
      cy.get('[data-testid="status-select"]').select('Offer Received');
      cy.get('[data-testid="offer-salary-input"]').type('90000');
      cy.get('[data-testid="save-status"]').click();
      cy.get('[data-testid="timeline-entry"]').should('contain', 'Offer received');
      
      // Verify timeline order
      cy.get('[data-testid="timeline-entry"]').eq(0).should('contain', 'Offer received');
      cy.get('[data-testid="timeline-entry"]').eq(1).should('contain', 'Interview scheduled');
      cy.get('[data-testid="timeline-entry"]').eq(2).should('contain', 'Status updated to Applied');
      cy.get('[data-testid="timeline-entry"]').eq(3).should('contain', 'Application created');
    });

    it('should handle timeline with custom notes', () => {
      // Login and create application
      cy.login('user1@example.com', 'password123');
      cy.createTestApplication('Notes Job', 'Notes Company');
      
      // Add timeline entry with notes
      cy.get('[data-testid="application-card"]').first().click();
      cy.get('[data-testid="add-timeline-entry"]').click();
      cy.get('[data-testid="timeline-note-input"]').type('Had a great phone call with the hiring manager');
      cy.get('[data-testid="timeline-type-select"]').select('Phone Call');
      cy.get('[data-testid="save-timeline-entry"]').click();
      
      // Verify timeline entry
      cy.get('[data-testid="timeline-entry"]').should('contain', 'Phone Call');
      cy.get('[data-testid="timeline-entry"]').should('contain', 'Had a great phone call with the hiring manager');
    });

    it('should handle timeline with attachments', () => {
      // Login and create application
      cy.login('user1@example.com', 'password123');
      cy.createTestApplication('Attachment Job', 'Attachment Company');
      
      // Add timeline entry with attachment
      cy.get('[data-testid="application-card"]').first().click();
      cy.get('[data-testid="add-timeline-entry"]').click();
      cy.get('[data-testid="timeline-note-input"]').type('Received offer letter');
      cy.get('[data-testid="timeline-type-select"]').select('Document');
      cy.get('[data-testid="timeline-attachment-input"]').attachFile('offer-letter.pdf');
      cy.get('[data-testid="save-timeline-entry"]').click();
      
      // Verify timeline entry with attachment
      cy.get('[data-testid="timeline-entry"]').should('contain', 'Document');
      cy.get('[data-testid="timeline-attachment"]').should('be.visible');
    });

    it('should handle timeline filtering and search', () => {
      // Login and create application with multiple timeline entries
      cy.login('user1@example.com', 'password123');
      cy.createTestApplication('Filter Job', 'Filter Company');
      
      // Add multiple timeline entries
      cy.get('[data-testid="application-card"]').first().click();
      
      // Add phone call entry
      cy.get('[data-testid="add-timeline-entry"]').click();
      cy.get('[data-testid="timeline-note-input"]').type('Initial phone screening');
      cy.get('[data-testid="timeline-type-select"]').select('Phone Call');
      cy.get('[data-testid="save-timeline-entry"]').click();
      
      // Add interview entry
      cy.get('[data-testid="add-timeline-entry"]').click();
      cy.get('[data-testid="timeline-note-input"]').type('Technical interview completed');
      cy.get('[data-testid="timeline-type-select"]').select('Interview');
      cy.get('[data-testid="save-timeline-entry"]').click();
      
      // Test filtering
      cy.get('[data-testid="timeline-filter"]').select('Phone Call');
      cy.get('[data-testid="timeline-entry"]').should('contain', 'Initial phone screening');
      cy.get('[data-testid="timeline-entry"]').should('not.contain', 'Technical interview completed');
      
      // Test search
      cy.get('[data-testid="timeline-search"]').type('technical');
      cy.get('[data-testid="timeline-entry"]').should('contain', 'Technical interview completed');
    });
  });

  describe('Data Synchronization Between Components', () => {
    it('should synchronize data across dashboard components', () => {
      // Login and create applications
      cy.login('user1@example.com', 'password123');
      cy.createTestApplication('Job 1', 'Company A');
      cy.createTestApplication('Job 2', 'Company B');
      cy.createTestApplication('Job 3', 'Company C');
      
      // Verify data consistency across components
      cy.get('[data-testid="application-list"]').find('[data-testid="application-card"]').should('have.length', 3);
      cy.get('[data-testid="application-count"]').should('contain', '3');
      cy.get('[data-testid="company-count"]').should('contain', '3');
      
      // Update application status
      cy.get('[data-testid="application-card"]').first().click();
      cy.get('[data-testid="status-select"]').select('Applied');
      cy.get('[data-testid="save-status"]').click();
      
      // Verify counts are updated
      cy.go('back');
      cy.get('[data-testid="applied-count"]').should('contain', '1');
      cy.get('[data-testid="pending-count"]').should('contain', '2');
    });

    it('should synchronize data between list and detail views', () => {
      // Login and create application
      cy.login('user1@example.com', 'password123');
      cy.createTestApplication('Sync Job', 'Sync Company');
      
      // Update in detail view
      cy.get('[data-testid="application-card"]').first().click();
      cy.get('[data-testid="edit-application"]').click();
      cy.get('[data-testid="job-title-input"]').clear().type('Updated Job Title');
      cy.get('[data-testid="save-application"]').click();
      
      // Verify list view is updated
      cy.go('back');
      cy.get('[data-testid="application-list"]').should('contain', 'Updated Job Title');
      
      // Verify detail view shows updated data
      cy.get('[data-testid="application-card"]').first().click();
      cy.get('[data-testid="job-title"]').should('contain', 'Updated Job Title');
    });

    it('should handle real-time updates', () => {
      // Login and create application
      cy.login('user1@example.com', 'password123');
      cy.createTestApplication('Real-time Job', 'Real-time Company');
      
      // Open application in multiple tabs
      cy.get('[data-testid="application-card"]').first().click();
      cy.window().then((win) => {
        const newWindow = win.open('/dashboard', '_blank');
        cy.wrap(newWindow).should('exist');
      });
      
      // Update in first tab
      cy.get('[data-testid="status-select"]').select('Applied');
      cy.get('[data-testid="save-status"]').click();
      
      // Verify second tab shows update
      cy.window().then((win) => {
        win.focus();
        cy.get('[data-testid="application-card"]').first().click();
        cy.get('[data-testid="application-status"]').should('contain', 'Applied');
      });
    });

    it('should handle data caching and invalidation', () => {
      // Login and create application
      cy.login('user1@example.com', 'password123');
      cy.createTestApplication('Cache Job', 'Cache Company');
      
      // Load application data (should be cached)
      cy.get('[data-testid="application-card"]').first().click();
      cy.get('[data-testid="application-detail"]').should('be.visible');
      
      // Update application in another tab
      cy.window().then((win) => {
        const newWindow = win.open('/dashboard', '_blank');
        cy.wrap(newWindow).should('exist');
      });
      
      cy.window().then((win) => {
        win.focus();
        cy.get('[data-testid="application-card"]').first().click();
        cy.get('[data-testid="edit-application"]').click();
        cy.get('[data-testid="job-title-input"]').clear().type('Cached Update');
        cy.get('[data-testid="save-application"]').click();
      });
      
      // Verify first tab shows updated data (cache invalidation)
      cy.window().then((win) => {
        win.focus();
        cy.get('[data-testid="job-title"]').should('contain', 'Cached Update');
      });
    });
  });
}); 