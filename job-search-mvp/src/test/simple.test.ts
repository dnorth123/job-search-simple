describe('Simple Test Suite', () => {
  test('should pass a basic test', () => {
    expect(1 + 1).toBe(2);
  });

  test('should handle async operations', async () => {
    const result = await Promise.resolve('test');
    expect(result).toBe('test');
  });

  test('should handle environment variables', () => {
    // Test that our environment mock is working
    expect(process.env.NODE_ENV).toBeDefined();
  });
}); 