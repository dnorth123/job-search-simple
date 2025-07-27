import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    retries: {
      runMode: 2,
      openMode: 0
    },
    env: {
      // Supabase test environment variables
      VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL || 'https://your-test-project.supabase.co',
      VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY || 'your-test-anon-key',
      // Test user credentials
      TEST_USER_EMAIL: process.env.TEST_USER_EMAIL || 'test@example.com',
      TEST_USER_PASSWORD: process.env.TEST_USER_PASSWORD || 'testpassword123',
      // Test data
      TEST_COMPANY_NAME: process.env.TEST_COMPANY_NAME || 'Test Company',
      TEST_JOB_TITLE: process.env.TEST_JOB_TITLE || 'Software Engineer'
    },
    setupNodeEvents(on) {
      // Implement node event listeners here
      on('task', {
        // Custom task to clean up test data
        cleanTestData() {
          // This would be implemented to clean up test data
          return null;
        },
        // Custom task to seed test data
        seedTestData() {
          // This would be implemented to seed test data
          return null;
        }
      });
    },
  },
  component: {
    devServer: {
      framework: 'react',
      bundler: 'vite',
    },
  },
}); 