import { validateUrl, extractTextFromUrl } from '../utils/jobDescriptionParser';

describe('URL Parsing', () => {
  test('validateUrl should validate correct URLs', () => {
    expect(validateUrl('https://example.com')).toBe(true);
    expect(validateUrl('http://example.com/job-posting')).toBe(true);
    expect(validateUrl('https://www.linkedin.com/jobs/view/123')).toBe(true);
  });

  test('validateUrl should reject invalid URLs', () => {
    expect(validateUrl('not-a-url')).toBe(false);
    expect(validateUrl('ftp://example.com')).toBe(false);
    expect(validateUrl('')).toBe(false);
  });

  test('extractTextFromUrl should handle CORS errors gracefully', async () => {
    // This test verifies that the function handles CORS errors appropriately
    await expect(extractTextFromUrl('https://httpbin.org/status/403'))
      .rejects
      .toThrow('Access to this URL is forbidden');
  });

  test('extractTextFromUrl should handle successful extraction', async () => {
    // Mock a successful response for testing
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        text: () => Promise.resolve('<html><body><h1>Job Title</h1><p>Job description content</p></body></html>'),
      })
    ) as jest.Mock;

    const result = await extractTextFromUrl('https://example.com/job');
    expect(result).toContain('Job Title');
    expect(result).toContain('Job description content');
  });
}); 