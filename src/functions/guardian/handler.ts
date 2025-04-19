import puppeteer, { Browser, Page, HTTPResponse } from 'puppeteer';
import { parseWorkOrdersTable } from './orderTableParser';
interface WebResponse {
  url: string;
  status: number;
  body: string;
}

interface LoginCredentials {
  username: string;
  password: string;
}

let browser: Browser | null = null;
let workOrdersResponse: WebResponse = {
  url: '',
  status: 0,
  body: ''
};

const initPuppeteer = async (): Promise<Browser> => {
  return await puppeteer.launch({
    headless: false,
    args: [
      '--no-sandbox', // Disables the sandbox for all process types that are normally sandboxed
      '--disable-setuid-sandbox', // Disables the setuid sandbox (Linux only)
    ]
  });
};

const setupPageHeaders = async (page: Page): Promise<void> => {
  await page.setExtraHTTPHeaders({
    'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'accept-language': 'en-US,en;q=0.9',
    'cache-control': 'max-age=0',
    'priority': 'u=0, i',
    'sec-ch-ua': '"Google Chrome";v="135", "Not-A.Brand";v="8", "Chromium";v="135"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"macOS"',
    'sec-fetch-dest': 'document',
    'sec-fetch-mode': 'navigate',
    'sec-fetch-site': 'none',
    'sec-fetch-user': '?1',
    'upgrade-insecure-requests': '1',
    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36'
  });

  await page.setCookie({
    name: 'django_language',
    value: 'en-us',
    domain: 'gppvendor.com',
    path: '/'
  });
};

const visitLoginPage = async (page: Page): Promise<WebResponse> => {
  let loginResponse: WebResponse = {
    url: '',
    status: 0,
    body: ''
  };

  page.on('response', async (response: HTTPResponse) => {
    const req = response.request();
    if (req.method() === 'GET' && req.url() === 'https://gppvendor.com/users/login/') {
      console.log('Login page response received');
      try {
        const url = response.url();
        const status = response.status();
        const body = await response.text();
        loginResponse = { url, status, body };
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        console.error(`Error parsing login response:`, errorMessage);
      }
    }
  });

  await page.goto('https://gppvendor.com/users/login/', {
    waitUntil: ['domcontentloaded', 'networkidle2'],
    timeout: process.env.PUPPETEER_TIMEOUT ? parseInt(process.env.PUPPETEER_TIMEOUT) : 5000
  });

  if (loginResponse.url === '') {
    throw new Error('No login response captured');
  }

  return loginResponse;
};

const submitLoginForm = async (page: Page, credentials: LoginCredentials): Promise<void> => {
  await page.type('#id_username', credentials.username);
  await page.type('#id_password', credentials.password);
  await Promise.all([
    page.click('button[type="submit"]'),
    page.waitForNavigation({ waitUntil: ['networkidle2', 'domcontentloaded'] }),
  ]);
};

const visitWorkOrdersPage = async (page: Page): Promise<WebResponse> => {
  // Set up response listener for work orders page
  page.on('response', async (response: HTTPResponse) => {
    const req = response.request();
    if (req.method() === 'GET' && req.url() === 'https://gppvendor.com/work-orders/requests/') {
      console.log('Work orders page response received');
      try {
        const url = response.url();
        const status = response.status();
        const body = await response.text();
        workOrdersResponse = { url, status, body };
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        console.error(`Error parsing work orders response:`, errorMessage);
      }
    }
  });

  // Navigate to work orders page
  await page.goto('https://gppvendor.com/work-orders/requests/', {
    waitUntil: ['domcontentloaded', 'networkidle2'],
    timeout: process.env.PUPPETEER_TIMEOUT ? parseInt(process.env.PUPPETEER_TIMEOUT) : 5000
  });

  // Wait for and get the table content
  const table = await page.waitForSelector('div.container.container-lg.pt-4 > div > div > table');
  /* istanbul ignore next */
  let tableBody = await table?.evaluate((el: Element) => el.outerHTML);

  if (!tableBody) {
    throw new Error('Failed to extract table content');
  }

  const workOrders = parseWorkOrdersTable(tableBody);

  workOrdersResponse.body = JSON.stringify(workOrders);
  return workOrdersResponse;
};

export const handler = async (event: unknown): Promise<{
  statusCode: number;
  body: WebResponse;
}> => {
  if (!process.env.GUARDIAN_LOGIN_USERNAME || !process.env.GUARDIAN_LOGIN_PASSWORD) {
    throw new Error('Login credentials not configured in environment variables');
  }

  try {
    browser = await initPuppeteer();
    const page = await browser.newPage();

    // Setup page headers and cookies
    await setupPageHeaders(page);

    // Visit and verify login page
    await visitLoginPage(page);

    // Fill and submit login form
    await submitLoginForm(page, {
      username: process.env.GUARDIAN_LOGIN_USERNAME,
      password: process.env.GUARDIAN_LOGIN_PASSWORD
    });

    // Visit work orders page and get table data
    const workOrdersData = await visitWorkOrdersPage(page);

    return {
      statusCode: 200,
      body: workOrdersData
    };
  } catch (err) {
    console.error('Login automation failed:', err);
    throw new Error(err instanceof Error ? err.message : 'An unknown error occurred');
  } finally {
    if (browser !== null) {
      await browser.close();
    }
  }
};