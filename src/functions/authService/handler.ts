import { APIGatewayProxyHandler, APIGatewayProxyEvent } from 'aws-lambda';
import { AuthService } from './service';
import debug from '@shared/debug';
import { successResponse, badResponse, errorResponse } from './responses';

// Initialize service
const authService = new AuthService();

// Helper function
const getDecodedBody = (event: APIGatewayProxyEvent): string => {
  if (!event.body) {
    throw new Error('Missing request body');
  }
  return event.isBase64Encoded 
    ? Buffer.from(event.body, 'base64').toString('utf-8')
    : event.body;
};

// Route handlers
const signUp = async (event: APIGatewayProxyEvent) => {
  try {
    const decodedBody = getDecodedBody(event);
    const data = JSON.parse(decodedBody);
    
    const result = await authService.signUp(data);
    return successResponse(null, result.statusCode);
  } catch (error) {
    debug('Error in signup:', error);
    return badResponse('Failed to create user', 400);
  }
};

const login = async (event: APIGatewayProxyEvent) => {
  try {
    const decodedBody = getDecodedBody(event);
    const data = JSON.parse(decodedBody);
    
    const result = await authService.login(data);
    return successResponse(result.data, result.statusCode);
  } catch (error) {
    debug('Error in login:', error);
    return badResponse('Invalid credentials', 401);
  }
};

const forgotPassword = async (event: APIGatewayProxyEvent) => {
  try {
    const decodedBody = getDecodedBody(event);
    const data = JSON.parse(decodedBody);
    
    const result = await authService.forgotPassword(data);
    return successResponse(null, result.statusCode);
  } catch (error) {
    debug('Error in forgot password:', error);
    return badResponse('Failed to process password reset request', 400);
  }
};

const confirmForgotPassword = async (event: APIGatewayProxyEvent) => {
  try {
    const decodedBody = getDecodedBody(event);
    const data = JSON.parse(decodedBody);
    
    const result = await authService.confirmForgotPassword(data);
    return successResponse(null, result.statusCode);
  } catch (error) {
    debug('Error in confirm forgot password:', error);
    return badResponse('Failed to reset password', 400);
  }
};

const changePassword = async (event: APIGatewayProxyEvent) => {
  try {
    const decodedBody = getDecodedBody(event);
    const data = JSON.parse(decodedBody);
    
    const result = await authService.changePassword(data);
    return successResponse(null, result.statusCode);
  } catch (error) {
    debug('Error in change password:', error);
    return badResponse('Failed to change password', 400);
  }
};

// Main handler
export const handler: APIGatewayProxyHandler = async (event, context) => {
  debug('Incoming event:', event);
  debug('Incoming context:', context);

  if (!event?.httpMethod || !event?.path) {
    return errorResponse(new Error('Invalid event structure'));
  }

  try {
    // CORS preflight
    if (event.httpMethod === 'OPTIONS') {
      return successResponse(null);
    }

    // Route handling
    if (event.path === '/auth') {
      let response;
      
      switch (event.httpMethod) {
        case 'POST':
          const action = event.queryStringParameters?.action;
          switch (action) {
            case 'signup':
              response = await signUp(event);
              break;
            case 'login':
              response = await login(event);
              break;
            case 'forgot-password':
              response = await forgotPassword(event);
              break;
            case 'confirm-forgot-password':
              response = await confirmForgotPassword(event);
              break;
            case 'change-password':
              response = await changePassword(event);
              break;
            default:
              response = badResponse('Invalid action', 400);
          }
          break;
        default:
          response = badResponse('Method not allowed', 405);
      }
      
      return response;
    }

    return badResponse('Not found', 404);
  } catch (error) {
    debug('Unhandled error:', error);
    return errorResponse(error as Error);
  }
}; 