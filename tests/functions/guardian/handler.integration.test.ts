import { handler } from '../../../src/functions/guardian/handler';
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Set Puppeteer cache directory
process.env.PUPPETEER_CACHE_DIR = '/tmp/puppeteer-cache';

describe.skip('Guardian Handler Integration', () => {
  test('should successfully load login page', async () => {
    const result = await handler({});

    expect(result.statusCode).toBe(200);
    const response = JSON.parse(result.body.body);
    
    expect(response).toEqual(
      expect.objectContaining({
        loginResponse: expect.objectContaining({
          body: expect.stringMatching(/<html.*>/i),
          status: 200,
          url: expect.stringContaining('gppvendor.com')
        }),
        message: 'Login successful'
      })
    );
  }, 30000); // 30 second timeout for browser operations

  test('should throw error when credentials are missing', async () => {
    const originalUsername = process.env.GUARDIAN_LOGIN_USERNAME;
    const originalPassword = process.env.GUARDIAN_LOGIN_PASSWORD;
    
    delete process.env.GUARDIAN_LOGIN_USERNAME;
    delete process.env.GUARDIAN_LOGIN_PASSWORD;

    await expect(handler({})).rejects.toThrow('Login credentials not configured in environment variables');

    // Restore env vars
    process.env.GUARDIAN_LOGIN_USERNAME = originalUsername;
    process.env.GUARDIAN_LOGIN_PASSWORD = originalPassword;
  });
}); 