import { APIGatewayProxyResult } from 'aws-lambda';

interface AuthResponse {
  statusCode: number;
  message?: string;
  data?: {
    accessToken?: string;
    idToken?: string;
    refreshToken?: string;
  };
}

interface ErrorResponse {
  message: string;
  statusCode: number;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.WEBSITE_URL || '',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent',
  'Access-Control-Max-Age': '300',
  'Content-Type': 'application/json'
};

const createResponse = (statusCode: number, body: AuthResponse | ErrorResponse): APIGatewayProxyResult => ({
  statusCode,
  headers: corsHeaders,
  body: JSON.stringify(body)
});

export function successResponse(data: AuthResponse['data'] | null, statusCode?: number): APIGatewayProxyResult;
export function successResponse(data: AuthResponse['data'] | null, statusCode = 200): APIGatewayProxyResult {
  const response: AuthResponse = {
    statusCode,
    data: data || undefined
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