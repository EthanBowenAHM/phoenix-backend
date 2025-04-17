import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ColorService } from './service';
import { DynamoDbConnector } from '@shared/dynamodb';
import { STSClient, AssumeRoleCommand } from '@aws-sdk/client-sts';
import DEBUG from '@shared/debug';

const stsClient = new STSClient({});

interface AuthorizationError {
  statusCode: number;
  message: string;
  errorType: 'INVALID_TENANT_ID' | 'MISSING_TENANT_ID' | 'UNAUTHORIZED_ACCESS';
}

function createAuthorizationError(type: AuthorizationError['errorType'], message: string): AuthorizationError {
  return {
    statusCode: 403,
    message,
    errorType: type
  };
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
    
    // Check for missing tenant ID
    if (!tenantId) {
      const error = createAuthorizationError(
        'MISSING_TENANT_ID',
        'Tenant ID not found in token claims'
      );
      return {
        statusCode: error.statusCode,
        body: JSON.stringify(error)
      };
    }

    // Validate tenant ID format
    if (!/^[a-zA-Z0-9-]+$/.test(tenantId)) {
      const error = createAuthorizationError(
        'INVALID_TENANT_ID',
        'Invalid tenant ID format'
      );
      return {
        statusCode: error.statusCode,
        body: JSON.stringify(error)
      };
    }

    let credentials;
    try {
      credentials = await getTenantCredentials(tenantId);
    } catch (error) {
      const authError = createAuthorizationError(
        'INVALID_TENANT_ID',
        'Failed to assume tenant role - tenant may not exist'
      );
      return {
        statusCode: authError.statusCode,
        body: JSON.stringify(authError)
      };
    }

    const dynamoDbConnector = new DynamoDbConnector(undefined, credentials);
    const colorService = new ColorService(dynamoDbConnector);

    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      
      // Verify the request is for the correct tenant
      if (body.tenantId && body.tenantId !== tenantId) {
        const error = createAuthorizationError(
          'UNAUTHORIZED_ACCESS',
          'Cannot submit colors for a different tenant'
        );
        return {
          statusCode: error.statusCode,
          body: JSON.stringify(error)
        };
      }

      const result = await colorService.saveColor(
        { ...body, tenantId },
        tenantId
      );
      return {
        statusCode: result.statusCode,
        body: JSON.stringify(result.data)
      };
    } else if (event.httpMethod === 'GET') {
      const firstName = event.queryStringParameters?.firstName;
      
      // Verify the request is for the correct tenant
      if (event.queryStringParameters?.tenantId && event.queryStringParameters.tenantId !== tenantId) {
        const error = createAuthorizationError(
          'UNAUTHORIZED_ACCESS',
          'Cannot access colors from a different tenant'
        );
        return {
          statusCode: error.statusCode,
          body: JSON.stringify(error)
        };
      }

      const result = await colorService.searchColors(
        tenantId,
        firstName,
        tenantId
      );
      return {
        statusCode: result.statusCode,
        body: JSON.stringify(result.data)
      };
    }

    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method not allowed' })
    };
  } catch (error) {
    DEBUG('Error in handler: %O', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' })
    };
  }
}