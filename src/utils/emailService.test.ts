import { emailService } from './emailService';

describe('EmailService', () => {
  beforeEach(() => {
    // Reset environment variables for testing
    delete import.meta.env.VITE_EMAIL_API_KEY;
    delete import.meta.env.VITE_FROM_EMAIL;
  });

  describe('Configuration', () => {
    it('should be disabled when no API key is provided', () => {
      const status = emailService.getConfigStatus();
      expect(status.enabled).toBe(false);
      expect(status.hasApiKey).toBe(false);
      expect(status.hasFromEmail).toBe(false);
    });

    it('should be enabled when both API key and from email are provided', () => {
      // Mock environment variables
      import.meta.env.VITE_EMAIL_API_KEY = 'test_api_key';
      import.meta.env.VITE_FROM_EMAIL = 'test@example.com';
      
      // Recreate the service to pick up new env vars
      const testService = new (emailService.constructor as any)();
      const status = testService.getConfigStatus();
      
      expect(status.enabled).toBe(true);
      expect(status.hasApiKey).toBe(true);
      expect(status.hasFromEmail).toBe(true);
    });
  });

  describe('Email Generation', () => {
    it('should generate valid email content', async () => {
      const testData = {
        adminEmail: 'admin@example.com',
        newBetaUsers: ['user1@example.com', 'user2@example.com'],
        totalCount: 10
      };

      // Mock the sendEmail method to avoid actual API calls
      const originalSendEmail = (emailService as any).sendEmail;
      (emailService as any).sendEmail = jest.fn().mockResolvedValue(true);

      const result = await emailService.sendBetaUserNotification(testData);

      expect(result).toBe(true);
      expect((emailService as any).sendEmail).toHaveBeenCalledWith({
        to: 'admin@example.com',
        subject: 'New Beta Users Added - 2 new invite(s)',
        body: expect.stringContaining('New Beta Users Added'),
        html: expect.stringContaining('<html>')
      });

      // Restore original method
      (emailService as any).sendEmail = originalSendEmail;
    });
  });

  describe('Error Handling', () => {
    it('should handle missing configuration gracefully', async () => {
      const testData = {
        adminEmail: 'admin@example.com',
        newBetaUsers: ['user1@example.com'],
        totalCount: 1
      };

      const result = await emailService.sendBetaUserNotification(testData);
      expect(result).toBe(false);
    });
  });
});