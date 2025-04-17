import handler from '../../../src/functions/guardian/handler';

// Mock puppeteer and chrome-aws-lambda
jest.mock('puppeteer-core');
jest.mock('chrome-aws-lambda');

describe('Guardian Handler', () => {
  let mockBrowser;
  let mockPage;

  beforeEach(() => {
    // Setup mock browser and page
    mockPage = {
      on: jest.fn(),
      goto: jest.fn(),
      $eval: jest.fn(),
      type: jest.fn(),
      click: jest.fn(),
      waitForNavigation: jest.fn(),
      waitForTimeout: jest.fn(),
      cookies: jest.fn().mockResolvedValue([{ name: 'test', value: 'cookie' }]),
    };

    mockBrowser = {
      newPage: jest.fn().mockResolvedValue(mockPage),
      close: jest.fn(),
    };

    require('puppeteer-core').launch.mockResolvedValue(mockBrowser);
    require('chrome-aws-lambda').executablePath.mockResolvedValue('/path/to/chrome');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully login and return cookies', async () => {
    // Mock environment variables
    process.env.LOGIN_USERNAME = 'testuser';
    process.env.LOGIN_PASSWORD = 'testpass';

    // Mock CSRF token
    mockPage.$eval.mockResolvedValueOnce('test-csrf-token');

    const result = await handler({});

    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body)).toEqual(
      expect.objectContaining({
        cookies: expect.any(Array),
        csrfToken: 'test-csrf-token',
        message: 'Login successful',
      })
    );
  });

  it('should throw error when credentials are missing', async () => {
    delete process.env.LOGIN_USERNAME;
    delete process.env.LOGIN_PASSWORD;

    await expect(handler({})).rejects.toThrow('Login credentials not configured in environment variables');
  });

  it('should handle browser launch errors', async () => {
    require('puppeteer-core').launch.mockRejectedValue(new Error('Browser launch failed'));

    await expect(handler({})).rejects.toThrow('Browser launch failed');
  });
});
