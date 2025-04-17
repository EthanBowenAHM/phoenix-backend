// Set environment variables before importing modules
process.env.WEBSITE_URL = 'https://example.com';

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { handler } from '../../../src/functions/colorService/handler';
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context, APIGatewayEventDefaultAuthorizerContext } from 'aws-lambda';
import { ColorService } from '../../../src/functions/colorService/service';
import { ColorSubmission } from '../../../src/generated/server';

const createMockRequestContext = (method: string) => ({
  accountId: '123456789012',
  apiId: 'test-api-id',
  httpMethod: method,
  path: '/dev/colors',
  protocol: 'HTTP/1.1',
  requestId: 'test-request-id',
  requestTimeEpoch: 1742834964789,
  resourceId: 'test-resource-id',
  resourcePath: '/colors',
  stage: 'dev',
  authorizer: {
    principalId: 'test-principal',
    claims: null,
    context: null,
  } as APIGatewayEventDefaultAuthorizerContext,
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
    sourceIp: '127.0.0.1',
    user: null,
    userAgent: 'test-agent',
    userArn: null,
  }
});

const createMockEvent = (options: {
  method: string;
  body?: any;
  queryStringParameters?: { [key: string]: string } | null;
}): APIGatewayProxyEvent => ({
  requestContext: createMockRequestContext(options.method),
  body: options.body ? JSON.stringify(options.body) : undefined,
  headers: {},
  multiValueHeaders: {},
  httpMethod: options.method,
  isBase64Encoded: false,
  path: '/colors',
  pathParameters: null,
  queryStringParameters: options.queryStringParameters || null,
  multiValueQueryStringParameters: null,
  stageVariables: null,
  resource: '/colors'
}) as APIGatewayProxyEvent;

const mockContext: Context = {
  callbackWaitsForEmptyEventLoop: true,
  functionName: 'test-function',
  functionVersion: '1',
  invokedFunctionArn: 'test-arn',
  memoryLimitInMB: '128',
  awsRequestId: 'test-request-id',
  logGroupName: 'test-log-group',
  logStreamName: 'test-log-stream',
  getRemainingTimeInMillis: () => 1000,
  done: () => {},
  fail: () => {},
  succeed: () => {},
};

describe('colorService Lambda', () => {
  let saveColorSpy: any;
  let searchColorsSpy: any;

  beforeEach(() => {
    jest.clearAllMocks();
    saveColorSpy = jest.spyOn(ColorService.prototype, 'saveColor');
    searchColorsSpy = jest.spyOn(ColorService.prototype, 'searchColors');
  });

  describe('POST /colors', () => {
    it('should successfully submit a color', async () => {
      // Arrange
      const mockSubmission: ColorSubmission = {
        firstName: 'John',
        color: 'blue',
      };
      const mockEvent = createMockEvent({
        method: 'POST',
        body: mockSubmission
      });
      const mockResponse = {
        data: {
          pk: 'John',
          colors: ['blue'],
          timestamp: '2024-01-01T00:00:00.000Z',
        },
        statusCode: 201,
      };

      saveColorSpy.mockImplementation(() => Promise.resolve(mockResponse as never));

      // Act
      const response = await handler(mockEvent, mockContext, () => {}) as APIGatewayProxyResult;

      // Assert
      expect(response.statusCode).toBe(201);
      expect(response.headers).toEqual({
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
        'Access-Control-Allow-Origin': 'https://example.com',
        'Access-Control-Max-Age': '300',
        'Content-Type': 'application/json'
      });
      const responseBody = JSON.parse(response.body);
      expect(responseBody).toEqual({
        data: mockResponse.data,
        statusCode: 201
      });
      expect(saveColorSpy).toHaveBeenCalledWith(mockSubmission);
    });

    it('should return 400 when required fields are missing', async () => {
      // Arrange
      const mockEvent = createMockEvent({
        method: 'POST',
        body: { firstName: 'John' }
      });

      // Act
      const response = await handler(mockEvent, mockContext, () => {}) as APIGatewayProxyResult;

      // Assert
      expect(response.statusCode).toBe(400);
      const responseBody = JSON.parse(response.body);
      expect(responseBody).toEqual({
        message: 'Missing required fields',
        statusCode: 400
      });
      expect(saveColorSpy).not.toHaveBeenCalled();
    });

    it('should return 500 when service operation fails', async () => {
      // Arrange
      const mockSubmission: ColorSubmission = {
        firstName: 'John',
        color: 'blue',
      };
      const mockEvent = createMockEvent({
        method: 'POST',
        body: mockSubmission
      });
      saveColorSpy.mockRejectedValue(new Error('Internal server error') as never);

      // Act
      const response = await handler(mockEvent, mockContext, () => {}) as APIGatewayProxyResult;

      // Assert
      expect(response.statusCode).toBe(500);
      const responseBody = JSON.parse(response.body);
      expect(responseBody).toEqual({
        message: 'Internal server error',
        statusCode: 500
      });
      expect(saveColorSpy).toHaveBeenCalledWith(mockSubmission);
    });
  });

  describe('GET /colors', () => {
    it('should successfully search colors by firstName', async () => {
      // Arrange
      const mockFirstName = 'John';
      const mockEvent = createMockEvent({
        method: 'GET',
        queryStringParameters: { firstName: mockFirstName }
      });
      const mockResponse = {
        data: [
          {
            pk: 'John',
            colors: ['blue'],
            timestamp: '2024-01-01T00:00:00.000Z',
          },
        ],
        statusCode: 200,
      };
      searchColorsSpy.mockImplementation(() => Promise.resolve(mockResponse as never));

      // Act
      const response = await handler(mockEvent, mockContext, () => {}) as APIGatewayProxyResult;

      // Assert
      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toEqual({
        data: mockResponse.data,
        statusCode: 200
      });
      expect(searchColorsSpy).toHaveBeenCalledWith(mockFirstName);
    });

    it('should return 400 when firstName parameter is missing', async () => {
      // Arrange
      const mockEvent = createMockEvent({
        method: 'GET',
        queryStringParameters: null
      });

      // Act
      const response = await handler(mockEvent, mockContext, () => {}) as APIGatewayProxyResult;

      // Assert
      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body)).toEqual({
        message: 'Missing required firstName parameter',
        statusCode: 400
      });
    });

    it('should return 500 when service operation fails', async () => {
      // Arrange
      const mockFirstName = 'John';
      const mockEvent = createMockEvent({
        method: 'GET',
        queryStringParameters: { firstName: mockFirstName }
      });
      searchColorsSpy.mockRejectedValue(new Error('Internal server error') as never);

      // Act
      const response = await handler(mockEvent, mockContext, () => {}) as APIGatewayProxyResult;

      // Assert
      expect(response.statusCode).toBe(500);
      expect(JSON.parse(response.body)).toEqual({
        message: 'Internal server error',
        statusCode: 500
      });
      expect(searchColorsSpy).toHaveBeenCalledWith(mockFirstName);
    });
  });

  describe('OPTIONS /colors', () => {
    it('should return CORS headers for preflight requests', async () => {
      // Arrange
      const mockEvent = createMockEvent({
        method: 'OPTIONS'
      });

      // Act
      const response = await handler(mockEvent, mockContext, () => {}) as APIGatewayProxyResult;

      // Assert
      expect(response.statusCode).toBe(200);
      expect(response.headers).toEqual({
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
        'Access-Control-Allow-Origin': 'https://example.com',
        'Access-Control-Max-Age': '300',
        'Content-Type': 'application/json'
      });
      expect(JSON.parse(response.body)).toEqual({
        statusCode: 200
      });
    });

    it('should handle missing WEBSITE_URL environment variable', async () => {
      // Arrange
      delete process.env.WEBSITE_URL;
      const mockEvent = createMockEvent({
        method: 'OPTIONS'
      });

      // Act
      const response = await handler(mockEvent, mockContext, () => {}) as APIGatewayProxyResult;

      // Assert
      expect(response.statusCode).toBe(200);
      expect(response.headers).toEqual({
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
        'Access-Control-Allow-Origin': 'https://example.com',
        'Access-Control-Max-Age': '300',
        'Content-Type': 'application/json'
      });
      expect(JSON.parse(response.body)).toEqual({
        statusCode: 200
      });
    });
  });

  describe('Unsupported Methods', () => {
    it('should return 405 for unsupported HTTP methods', async () => {
      // Arrange
      const mockEvent = createMockEvent({
        method: 'PUT'
      });

      // Act
      const response = await handler(mockEvent, mockContext, () => {}) as APIGatewayProxyResult;

      // Assert
      expect(response.statusCode).toBe(405);
      expect(JSON.parse(response.body)).toEqual({
        message: 'Method not allowed',
        statusCode: 405
      });
      expect(saveColorSpy).not.toHaveBeenCalled();
    });
  });
}); 