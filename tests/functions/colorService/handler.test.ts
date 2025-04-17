// Set environment variables before importing modules
process.env.WEBSITE_URL = 'https://example.com';
process.env.TENANT_ROLE_ARN = 'arn:aws:iam::123456789012:role/test-role';

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { handler } from '../../../src/functions/colorService/handler';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ColorService } from '../../../src/functions/colorService/service';
import { ColorSubmission } from '../../../src/generated/server';

// Mock the entire AWS SDK module
jest.mock('@aws-sdk/client-sts', () => {
  return {
    STSClient: function() {
      return {
        send: () => Promise.resolve({
          Credentials: {
            AccessKeyId: 'mock-access-key',
            SecretAccessKey: 'mock-secret-key',
            SessionToken: 'mock-session-token',
            Expiration: new Date()
          }
        })
      };
    },
    AssumeRoleCommand: function() { return {}; }
  };
});

jest.mock('../../../src/functions/colorService/service');

interface MultiTenantColorSubmission extends ColorSubmission {
  tenantId: string;
}

const createMockRequestContext = (method: string, tenantId: string) => ({
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
    claims: {
      'custom:tenant_id': tenantId
    }
  },
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
  tenantId?: string;
}): APIGatewayProxyEvent => ({
  requestContext: createMockRequestContext(options.method, options.tenantId || 'test-tenant'),
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

describe('colorService Lambda', () => {
  let saveColorSpy: any;
  let searchColorsSpy: any;
  const TEST_TENANT_ID = 'test-tenant-123';

  beforeEach(() => {
    jest.clearAllMocks();
    saveColorSpy = jest.spyOn(ColorService.prototype, 'saveColor');
    searchColorsSpy = jest.spyOn(ColorService.prototype, 'searchColors');
  });

  describe('POST /colors', () => {
    it('should successfully submit a color', async () => {
      // Arrange
      const mockSubmission: MultiTenantColorSubmission = {
        firstName: 'John',
        color: 'blue',
        tenantId: TEST_TENANT_ID
      };
      const mockEvent = createMockEvent({
        method: 'POST',
        body: mockSubmission,
        tenantId: TEST_TENANT_ID
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
      const response = await handler(mockEvent) as APIGatewayProxyResult;

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
      expect(saveColorSpy).toHaveBeenCalledWith(mockSubmission, TEST_TENANT_ID);
    });

    it('should return 400 when required fields are missing', async () => {
      // Arrange
      const mockEvent = createMockEvent({
        method: 'POST',
        body: { firstName: 'John' },
        tenantId: TEST_TENANT_ID
      });

      // Act
      const response = await handler(mockEvent) as APIGatewayProxyResult;

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
      const mockSubmission: MultiTenantColorSubmission = {
        firstName: 'John',
        color: 'blue',
        tenantId: TEST_TENANT_ID
      };
      const mockEvent = createMockEvent({
        method: 'POST',
        body: mockSubmission,
        tenantId: TEST_TENANT_ID
      });
      saveColorSpy.mockRejectedValue(new Error('Internal server error') as never);

      // Act
      const response = await handler(mockEvent) as APIGatewayProxyResult;

      // Assert
      expect(response.statusCode).toBe(500);
      const responseBody = JSON.parse(response.body);
      expect(responseBody).toEqual({
        message: 'Internal server error',
        statusCode: 500
      });
      expect(saveColorSpy).toHaveBeenCalledWith(mockSubmission, TEST_TENANT_ID);
    });

    it('should return 403 when tenant IDs do not match', async () => {
      // Arrange
      const mockSubmission: MultiTenantColorSubmission = {
        firstName: 'John',
        color: 'blue',
        tenantId: 'different-tenant'
      };
      const mockEvent = createMockEvent({
        method: 'POST',
        body: mockSubmission,
        tenantId: TEST_TENANT_ID
      });

      // Act
      const response = await handler(mockEvent) as APIGatewayProxyResult;

      // Assert
      expect(response.statusCode).toBe(403);
      const responseBody = JSON.parse(response.body);
      expect(responseBody).toEqual({
        message: 'Cannot submit colors for a different tenant',
        statusCode: 403,
        errorType: 'UNAUTHORIZED_ACCESS'
      });
      expect(saveColorSpy).not.toHaveBeenCalled();
    });
  });

  describe('GET /colors', () => {
    it('should successfully search colors by firstName', async () => {
      // Arrange
      const mockFirstName = 'John';
      const mockEvent = createMockEvent({
        method: 'GET',
        queryStringParameters: { firstName: mockFirstName },
        tenantId: TEST_TENANT_ID
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
      const response = await handler(mockEvent) as APIGatewayProxyResult;

      // Assert
      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toEqual({
        data: mockResponse.data,
        statusCode: 200
      });
      expect(searchColorsSpy).toHaveBeenCalledWith(TEST_TENANT_ID, mockFirstName, TEST_TENANT_ID);
    });

    it('should return 400 when firstName parameter is missing', async () => {
      // Arrange
      const mockEvent = createMockEvent({
        method: 'GET',
        queryStringParameters: null,
        tenantId: TEST_TENANT_ID
      });

      // Act
      const response = await handler(mockEvent) as APIGatewayProxyResult;

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
        queryStringParameters: { firstName: mockFirstName },
        tenantId: TEST_TENANT_ID
      });
      searchColorsSpy.mockRejectedValue(new Error('Internal server error') as never);

      // Act
      const response = await handler(mockEvent) as APIGatewayProxyResult;

      // Assert
      expect(response.statusCode).toBe(500);
      expect(JSON.parse(response.body)).toEqual({
        message: 'Internal server error',
        statusCode: 500
      });
      expect(searchColorsSpy).toHaveBeenCalledWith(TEST_TENANT_ID, mockFirstName, TEST_TENANT_ID);
    });

    it('should return 403 when tenant IDs do not match', async () => {
      // Arrange
      const mockEvent = createMockEvent({
        method: 'GET',
        queryStringParameters: { firstName: 'John', tenantId: 'different-tenant' },
        tenantId: TEST_TENANT_ID
      });

      // Act
      const response = await handler(mockEvent) as APIGatewayProxyResult;

      // Assert
      expect(response.statusCode).toBe(403);
      expect(JSON.parse(response.body)).toEqual({
        message: 'Cannot access colors from a different tenant',
        statusCode: 403,
        errorType: 'UNAUTHORIZED_ACCESS'
      });
      expect(searchColorsSpy).not.toHaveBeenCalled();
    });
  });

  describe('OPTIONS /colors', () => {
    it('should return CORS headers for preflight requests', async () => {
      // Arrange
      const mockEvent = createMockEvent({
        method: 'OPTIONS',
        tenantId: TEST_TENANT_ID
      });

      // Act
      const response = await handler(mockEvent) as APIGatewayProxyResult;

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
        method: 'PUT',
        tenantId: TEST_TENANT_ID
      });

      // Act
      const response = await handler(mockEvent) as APIGatewayProxyResult;

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