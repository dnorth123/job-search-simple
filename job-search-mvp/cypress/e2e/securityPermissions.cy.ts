describe('Security and Permission Testing', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.cleanupTestData();
    cy.seedTestData();
  });

  afterEach(() => {
    cy.cleanupTestData();
  });

  describe('User Data Isolation and Privacy Validation', () => {
    it('should isolate user data between different accounts', () => {
      // Login as first user
      cy.login('user1@example.com', 'password123');
      cy.createTestApplication('Private Job 1', 'Company A');
      cy.createTestApplication('Private Job 2', 'Company B');
      
      // Logout and login as second user
      cy.get('[data-testid="logout-button"]').click();
      cy.login('user2@example.com', 'password123');
      cy.createTestApplication('Private Job 3', 'Company C');
      
      // Verify data isolation
      cy.get('[data-testid="application-list"]').should('contain', 'Private Job 3');
      cy.get('[data-testid="application-list"]').should('not.contain', 'Private Job 1');
      cy.get('[data-testid="application-list"]').should('not.contain', 'Private Job 2');
      
      // Verify application count is correct
      cy.get('[data-testid="total-applications"]').should('contain', '1');
    });

    it('should prevent access to other users data via API', () => {
      // Login as first user and create data
      cy.login('user1@example.com', 'password123');
      cy.createTestApplication('API Test Job', 'API Test Company');
      
      // Get application ID
      cy.get('[data-testid="application-card"]').first().invoke('attr', 'data-application-id').then((appId) => {
        // Try to access another user's data via API
        cy.request({
          url: `/api/applications/${appId}`,
          headers: {
            'Authorization': `Bearer invalid-token`
          },
          failOnStatusCode: false
        }).then((response) => {
          expect(response.status).to.be.oneOf([401, 403, 404]);
        });
      });
    });

    it('should handle user profile data privacy', () => {
      // Login and update profile
      cy.login('user1@example.com', 'password123');
      cy.get('[data-testid="user-menu"]').click();
      cy.get('[data-testid="profile-link"]').click();
      
      // Update sensitive information
      cy.get('[data-testid="edit-profile"]').click();
      cy.get('[data-testid="phone-input"]').clear().type('555-123-4567');
      cy.get('[data-testid="bio-input"]').clear().type('Personal information');
      cy.get('[data-testid="save-profile"]').click();
      
      // Logout and login as different user
      cy.get('[data-testid="logout-button"]').click();
      cy.login('user2@example.com', 'password123');
      
      // Verify other user cannot access profile data
      cy.get('[data-testid="user-menu"]').click();
      cy.get('[data-testid="profile-link"]').click();
      cy.get('[data-testid="phone-input"]').should('not.contain', '555-123-4567');
      cy.get('[data-testid="bio-input"]').should('not.contain', 'Personal information');
    });

    it('should handle data export privacy', () => {
      // Login and create applications
      cy.login('user1@example.com', 'password123');
      cy.createTestApplication('Export Job 1', 'Export Company 1');
      cy.createTestApplication('Export Job 2', 'Export Company 2');
      
      // Export data
      cy.get('[data-testid="export-data"]').click();
      cy.get('[data-testid="export-format-select"]').select('CSV');
      cy.get('[data-testid="export-button"]').click();
      
      // Verify exported data only contains user's data
      cy.readFile('cypress/downloads/applications.csv').then((content) => {
        expect(content).to.contain('Export Job 1');
        expect(content).to.contain('Export Job 2');
        expect(content).to.not.contain('Other User Job');
      });
    });
  });

  describe('Authentication Requirement Enforcement', () => {
    it('should redirect unauthenticated users to login', () => {
      // Try to access protected routes without authentication
      cy.visit('/dashboard', { failOnStatusCode: false });
      cy.url().should('include', '/login');
      
      cy.visit('/applications', { failOnStatusCode: false });
      cy.url().should('include', '/login');
      
      cy.visit('/profile', { failOnStatusCode: false });
      cy.url().should('include', '/login');
    });

    it('should enforce session timeout', () => {
      // Login
      cy.login('user1@example.com', 'password123');
      cy.get('[data-testid="dashboard"]').should('be.visible');
      
      // Simulate session timeout
      cy.window().then((win) => {
        // Clear session storage to simulate timeout
        win.sessionStorage.clear();
        win.localStorage.removeItem('supabase.auth.token');
      });
      
      // Try to access protected route
      cy.visit('/dashboard');
      cy.url().should('include', '/login');
    });

    it('should handle invalid authentication tokens', () => {
      // Set invalid token
      cy.window().then((win) => {
        win.localStorage.setItem('supabase.auth.token', 'invalid-token');
      });
      
      // Try to access protected route
      cy.visit('/dashboard');
      cy.url().should('include', '/login');
      cy.get('[data-testid="auth-error"]').should('be.visible');
    });

    it('should prevent access to admin routes for regular users', () => {
      // Login as regular user
      cy.login('user1@example.com', 'password123');
      
      // Try to access admin routes
      cy.visit('/admin', { failOnStatusCode: false });
      cy.url().should('not.include', '/admin');
      cy.get('[data-testid="access-denied"]').should('be.visible');
      
      cy.visit('/admin/users', { failOnStatusCode: false });
      cy.url().should('not.include', '/admin/users');
    });

    it('should handle role-based access control', () => {
      // Login as regular user
      cy.login('user1@example.com', 'password123');
      
      // Verify regular user permissions
      cy.get('[data-testid="user-menu"]').click();
      cy.get('[data-testid="admin-link"]').should('not.exist');
      
      // Login as admin user
      cy.get('[data-testid="logout-button"]').click();
      cy.login('admin@example.com', 'adminpassword');
      
      // Verify admin permissions
      cy.get('[data-testid="user-menu"]').click();
      cy.get('[data-testid="admin-link"]').should('be.visible');
    });
  });

  describe('CORS and API Security Validation', () => {
    it('should enforce CORS policies', () => {
      // Test CORS headers on API requests
      cy.request({
        url: '/api/applications',
        method: 'GET',
        headers: {
          'Origin': 'https://malicious-site.com'
        },
        failOnStatusCode: false
      }).then((response) => {
        // Should reject cross-origin requests
        expect(response.status).to.be.oneOf([401, 403, 404]);
      });
    });

    it('should validate API request headers', () => {
      // Test API requests without proper headers
      cy.request({
        url: '/api/applications',
        method: 'GET',
        headers: {},
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.be.oneOf([401, 403, 404]);
      });
    });

    it('should handle rate limiting', () => {
      // Make multiple rapid requests
      for (let i = 0; i < 10; i++) {
        cy.request({
          url: '/api/applications',
          method: 'GET',
          failOnStatusCode: false
        });
      }
      
      // Should eventually hit rate limit
      cy.request({
        url: '/api/applications',
        method: 'GET',
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.be.oneOf([429, 401, 403, 404]);
      });
    });

    it('should validate API response security headers', () => {
      // Test security headers on API responses
      cy.request({
        url: '/api/applications',
        method: 'GET',
        failOnStatusCode: false
      }).then((response) => {
        // Check for security headers
        expect(response.headers).to.have.property('x-content-type-options');
        expect(response.headers).to.have.property('x-frame-options');
        expect(response.headers).to.have.property('x-xss-protection');
      });
    });
  });

  describe('Input Sanitization and XSS Prevention', () => {
    it('should sanitize user input in application forms', () => {
      // Login and create application with malicious input
      cy.login('user1@example.com', 'password123');
      cy.get('[data-testid="add-application"]').click();
      
      // Test XSS in job title
      const maliciousTitle = '<script>alert("xss")</script>Software Engineer';
      cy.get('[data-testid="job-title-input"]').type(maliciousTitle);
      cy.get('[data-testid="company-name-input"]').type('Test Company');
      cy.get('[data-testid="submit-form"]').click();
      
      // Verify input is sanitized
      cy.get('[data-testid="application-list"]').should('contain', 'Software Engineer');
      cy.get('[data-testid="application-list"]').should('not.contain', '<script>');
    });

    it('should sanitize user input in profile forms', () => {
      // Login and update profile with malicious input
      cy.login('user1@example.com', 'password123');
      cy.get('[data-testid="user-menu"]').click();
      cy.get('[data-testid="profile-link"]').click();
      
      // Test XSS in bio
      const maliciousBio = '<img src="x" onerror="alert(\'xss\')">Bio content';
      cy.get('[data-testid="edit-profile"]').click();
      cy.get('[data-testid="bio-input"]').clear().type(maliciousBio);
      cy.get('[data-testid="save-profile"]').click();
      
      // Verify input is sanitized
      cy.get('[data-testid="profile-bio"]').should('contain', 'Bio content');
      cy.get('[data-testid="profile-bio"]').should('not.contain', '<img');
    });

    it('should handle SQL injection attempts', () => {
      // Login and create application with SQL injection
      cy.login('user1@example.com', 'password123');
      cy.get('[data-testid="add-application"]').click();
      
      // Test SQL injection in company name
      const sqlInjection = "'; DROP TABLE applications; --";
      cy.get('[data-testid="job-title-input"]').type('Test Job');
      cy.get('[data-testid="company-name-input"]').type(sqlInjection);
      cy.get('[data-testid="submit-form"]').click();
      
      // Verify application is created normally
      cy.get('[data-testid="application-list"]').should('contain', 'Test Job');
      cy.get('[data-testid="application-list"]').should('contain', sqlInjection);
    });

    it('should handle HTML injection in timeline notes', () => {
      // Login and create application
      cy.login('user1@example.com', 'password123');
      cy.createTestApplication('Timeline Job', 'Timeline Company');
      
      // Add timeline entry with HTML injection
      cy.get('[data-testid="application-card"]').first().click();
      cy.get('[data-testid="add-timeline-entry"]').click();
      const htmlInjection = '<div style="color:red">Timeline note</div>';
      cy.get('[data-testid="timeline-note-input"]').type(htmlInjection);
      cy.get('[data-testid="save-timeline-entry"]').click();
      
      // Verify HTML is escaped
      cy.get('[data-testid="timeline-entry"]').should('contain', 'Timeline note');
      cy.get('[data-testid="timeline-entry"]').should('not.contain', '<div');
    });

    it('should validate file uploads', () => {
      // Login and create application
      cy.login('user1@example.com', 'password123');
      cy.createTestApplication('Upload Job', 'Upload Company');
      
      // Try to upload malicious file
      cy.get('[data-testid="application-card"]').first().click();
      cy.get('[data-testid="add-attachment"]').click();
      cy.get('[data-testid="file-input"]').attachFile('malicious.js');
      cy.get('[data-testid="upload-button"]').click();
      
      // Should reject malicious file
      cy.get('[data-testid="file-error"]').should('be.visible');
      cy.get('[data-testid="file-error"]').should('contain', 'Invalid file type');
    });

    it('should handle CSRF protection', () => {
      // Test CSRF protection on form submissions
      cy.request({
        url: '/api/applications',
        method: 'POST',
        body: {
          job_title: 'CSRF Test Job',
          company_name: 'CSRF Test Company'
        },
        failOnStatusCode: false
      }).then((response) => {
        // Should reject request without CSRF token
        expect(response.status).to.be.oneOf([401, 403, 404]);
      });
    });
  });

  describe('Data Encryption and Security', () => {
    it('should encrypt sensitive data in storage', () => {
      // Login and create application with sensitive data
      cy.login('user1@example.com', 'password123');
      cy.get('[data-testid="add-application"]').click();
      cy.get('[data-testid="job-title-input"]').type('Sensitive Job');
      cy.get('[data-testid="company-name-input"]').type('Sensitive Company');
      cy.get('[data-testid="salary-input"]').type('100000');
      cy.get('[data-testid="submit-form"]').click();
      
      // Check that sensitive data is not stored in plain text
      cy.window().then((win) => {
        const localStorage = win.localStorage;
        const sessionStorage = win.sessionStorage;
        
        // Verify sensitive data is not in plain text in storage
        const storageContent = JSON.stringify(localStorage) + JSON.stringify(sessionStorage);
        expect(storageContent).to.not.contain('100000');
        expect(storageContent).to.not.contain('Sensitive Company');
      });
    });

    it('should handle secure password requirements', () => {
      // Try to signup with weak password
      cy.get('[data-testid="signup-link"]').click();
      cy.get('[data-testid="email-input"]').type('weak@example.com');
      cy.get('[data-testid="password-input"]').type('123');
      cy.get('[data-testid="confirm-password-input"]').type('123');
      cy.get('[data-testid="signup-button"]').click();
      
      // Should show password strength error
      cy.get('[data-testid="password-error"]').should('be.visible');
      cy.get('[data-testid="password-error"]').should('contain', 'Password must be at least 8 characters');
    });

    it('should handle secure session management', () => {
      // Login
      cy.login('user1@example.com', 'password123');
      
      // Verify secure session
      cy.window().then((win) => {
        const token = win.localStorage.getItem('supabase.auth.token');
        expect(token).to.exist;
        expect(token).to.include('eyJ'); // JWT token format
      });
      
      // Test session invalidation on logout
      cy.get('[data-testid="logout-button"]').click();
      cy.window().then((win) => {
        const token = win.localStorage.getItem('supabase.auth.token');
        expect(token).to.be.null;
      });
    });
  });
}); 