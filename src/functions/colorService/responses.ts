import { APIGatewayProxyResult } from 'aws-lambda';
import { ColorRecordResponse, ErrorResponse, ColorRecord } from '@generated/server/model/models';

const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.WEBSITE_URL || '',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent',
  'Access-Control-Max-Age': '300',
  'Content-Type': 'application/json'
};

const createResponse = (statusCode: number, body: ColorRecordResponse | ErrorResponse): APIGatewayProxyResult => ({
  statusCode,
  headers: corsHeaders,
  body: JSON.stringify(body)
});

export function successResponse(data: ColorRecord | null, statusCode?: number): APIGatewayProxyResult;
export function successResponse(data: ColorRecord[], statusCode?: number): APIGatewayProxyResult;
export function successResponse(data: ColorRecord | ColorRecord[] | null, statusCode = 200): APIGatewayProxyResult {
  const response: ColorRecordResponse = {
    statusCode,
    data: Array.isArray(data) ? data[0] : data || undefined
  };
  return createResponse(statusCode, response);
}

export const badResponse = (message: string, statusCode = 400): APIGatewayProxyResult => {
  const response: ErrorResponse = {
    message,
    statusCode
  };
  return createResponse(statusCode, response);
};

export const errorResponse = (error: Error): APIGatewayProxyResult => {
  console.error('Unhandled error:', error);
  const response: ErrorResponse = {
    message: 'Internal server error',
    statusCode: 500
  };
  return createResponse(500, response);
}; 

export interface AuthorizationError {
  statusCode: number;
  message: string;
  errorType: 'INVALID_TENANT_ID' | 'MISSING_TENANT_ID' | 'UNAUTHORIZED_ACCESS';
}

export function createAuthorizationError(type: AuthorizationError['errorType'], message: string): APIGatewayProxyResult {
  return badResponse(`[${type}] ${message}`, 403);
}

