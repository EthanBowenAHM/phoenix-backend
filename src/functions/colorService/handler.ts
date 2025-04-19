import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ColorService } from './service';
import { DynamoDbConnector } from '@shared/dynamodb';
import { STSClient, AssumeRoleCommand } from '@aws-sdk/client-sts';
import DEBUG from '@shared/debug';
import { ColorRecord, ColorRecordResponse } from '@generated/server/model/models';
import { successResponse, badResponse, errorResponse, createAuthorizationError as authErrorResponse, AuthorizationError } from './responses';

const stsClient = new STSClient({});
async function validateTenant(tenantId: string | undefined): Promise<{ tenantId: string }> {
  // Check for missing tenant ID
  if (!tenantId) {
    throw authErrorResponse(
      'MISSING_TENANT_ID',
      'Tenant ID not found in token claims'
    );
  }

  // Validate tenant ID format
  if (!/^[a-zA-Z0-9-]+$/.test(tenantId)) {
    throw authErrorResponse(
      'INVALID_TENANT_ID',
      'Invalid tenant ID format'
    );
  }

  return { tenantId };
}

async function getTenantCredentials(tenantId: string) {
  const command = new AssumeRoleCommand({
    RoleArn: process.env.TENANT_ROLE_ARN!,
    RoleSessionName: `tenant-${tenantId}`,
    DurationSeconds: 900,
    Tags: [
      { Key: 'tenantId', Value: tenantId }
    ]
  });

  const response = await stsClient.send(command);
  return {
    accessKeyId: response.Credentials!.AccessKeyId!,
    secretAccessKey: response.Credentials!.SecretAccessKey!,
    sessionToken: response.Credentials!.SessionToken!
  };
}

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const tenantId = event.requestContext.authorizer?.claims['custom:tenant_id'];
    await validateTenant(tenantId);
    
    const credentials = await getTenantCredentials(tenantId);
    
    const dynamoDbConnector = new DynamoDbConnector(undefined, credentials);
    const colorService = new ColorService(dynamoDbConnector);

    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      
      // Verify the request is for the correct tenant
      if (body.tenantId && body.tenantId !== tenantId) {
        return authErrorResponse(
          'UNAUTHORIZED_ACCESS',
          'Cannot submit colors for a different tenant'
        );
      }

      const result = await colorService.saveColor(
        { ...body, tenantId: tenantId },
        tenantId
      );
      return successResponse(result.data);
    } else if (event.httpMethod === 'GET') {
      const firstName = event.queryStringParameters?.firstName;
      
      // Verify the request is for the correct tenant
      if (event.queryStringParameters?.tenantId && event.queryStringParameters.tenantId !== tenantId) {
        return authErrorResponse(
          'UNAUTHORIZED_ACCESS',
          'Cannot access colors from a different tenant'
        );
      }

      const result = await colorService.searchColors(
        tenantId,
        firstName,
        tenantId
      );
      return successResponse(result.data);
    }

    return badResponse('Method not allowed', 405);
  } catch (error) {
    DEBUG('Error in handler: %O', error);
    return errorResponse(error as Error);
  }
}