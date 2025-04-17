process.env.TABLE_NAME = 'color-dev-table';
process.env.DEBUG = '*';

import express from 'express';
import cors from 'cors';
import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { handler } from '../../src/functions/colorService/handler';
import DEBUG from '@shared/debug';

const app = express();
const port = process.env.PORT || 3000;

// CORS configuration
const corsOptions = {
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-Amz-Date', 'Authorization', 'X-Api-Key', 'X-Amz-Security-Token', 'X-Amz-User-Agent'],
  maxAge: 300,
  credentials: true
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Create mock Lambda context
const createMockContext = (): Context => ({
  callbackWaitsForEmptyEventLoop: true,
  functionName: 'local-color-service',
  functionVersion: 'local',
  invokedFunctionArn: 'local',
  memoryLimitInMB: '128',
  awsRequestId: 'local',
  logGroupName: 'local',
  logStreamName: 'local',
  getRemainingTimeInMillis: () => 30000,
  done: () => { },
  fail: () => { },
  succeed: () => { },
});

// Convert HTTP request to Lambda event
const createLambdaEvent = (req: express.Request): APIGatewayProxyEvent => ({
  body: JSON.stringify(req.body),
  headers: req.headers as { [key: string]: string },
  multiValueHeaders: {},
  httpMethod: req.method,
  isBase64Encoded: false,
  path: req.path,
  pathParameters: req.params,
  queryStringParameters: req.query as { [key: string]: string } | null,
  multiValueQueryStringParameters: null,
  stageVariables: null,
  requestContext: {
    accountId: 'local',
    apiId: 'local',
    authorizer: null,
    protocol: 'HTTP/1.1',
    httpMethod: req.method,
    identity: {
      accessKey: null,
      accountId: null,
      apiKey: null,
      apiKeyId: null,
      caller: null,
      clientCert: null,
      cognitoAuthenticationProvider: null,
      cognitoAuthenticationType: null,
      cognitoIdentityId: null,
      cognitoIdentityPoolId: null,
      principalOrgId: null,
      sourceIp: req.ip || '127.0.0.1',
      user: null,
      userAgent: req.get('user-agent') || '',
      userArn: null,
    },
    path: req.path,
    stage: 'local',
    requestId: 'local-' + Date.now(),
    requestTimeEpoch: Date.now(),
    resourceId: 'local',
    resourcePath: req.path,
  },
  resource: req.path,
});

// Generic handler for all routes
app.all('*', async (req, res) => {
  try {
    DEBUG('Incoming request:', {
      method: req.method,
      path: req.path,
      query: req.query,
      body: req.body,
    });

    const event = createLambdaEvent(req);
    const context = createMockContext();

    const result = await handler(event, context, () => { });

    if (!result) {
      throw new Error('Handler returned no response');
    }

    // Set response headers
    if (result.headers) {
      Object.entries(result.headers).forEach(([key, value]) => {
        if (typeof value === 'string' || typeof value === 'number') {
          res.setHeader(key, value);
        }
      });
    }

    // Set Content-Type header if not already set
    if (!res.getHeader('Content-Type')) {
      res.setHeader('Content-Type', 'application/json');
    }

    const corsHeaders = {
      'Access-Control-Allow-Origin': 'http://localhost:5173',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent',
      'Access-Control-Max-Age': '300',
      'Content-Type': 'application/json'
    };

    Object.entries(corsHeaders).forEach(([key, value]) => {
      res.setHeader(key, value);
    });

    // Set status code and send response
    res.status(result.statusCode).send(
      result.body ? JSON.parse(result.body) : null
    );
  } catch (error) {
    DEBUG('Error processing request: %O', error);
    res.status(500).json({
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Local development server running at http://localhost:${port}`);
}); 