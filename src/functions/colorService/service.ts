import { ColorSubmission, ColorRecord } from '@generated/server/model/models';
import { DynamoDbConnector } from '@shared/dynamodb';
import DEBUG from '@shared/debug';
import { omit } from 'lodash';

interface MultiTenantColorSubmission extends ColorSubmission {
  tenantId: string;
}

interface MultiTenantColorRecord {
  pk: string;
  sk: string;
  tenantId: string;
  firstName: string;
  color: string;
  colors: string[];
  timestamp: string;
}

export class ColorService {
  private dynamodbConnector: DynamoDbConnector;
  
  constructor(dynamodDbConnector?: DynamoDbConnector) {
    this.dynamodbConnector = dynamodDbConnector || new DynamoDbConnector();
  }

  private verifyTenantAccess(userTenantId: string, requestTenantId: string): void {
    if (userTenantId !== requestTenantId) {
      throw new Error('Unauthorized access to tenant');
    }
  }

  async saveColor(
    submission: MultiTenantColorSubmission,
    userTenantId: string
  ): Promise<{ data: ColorRecord; statusCode: number }> {
    this.verifyTenantAccess(userTenantId, submission.tenantId);
    
    const dynamoRecord: MultiTenantColorRecord = {
      pk: submission.firstName,
      sk: `COLOR#${Date.now()}`,
      tenantId: submission.tenantId,
      firstName: submission.firstName,
      color: submission.color,
      colors: [submission.color],
      timestamp: new Date().toISOString()
    };
    
    DEBUG('Saving DynamoDB record: %O', dynamoRecord);
    const record = await this.dynamodbConnector.saveColor(dynamoRecord);
    DEBUG('Saved record successfully');
    
    return {
      data: omit(record, ['tenantId', 'sk']),
      statusCode: 201
    };
  }

  async searchColors(
    tenantId: string,
    firstName?: string,
    userTenantId?: string
  ): Promise<{ data: ColorRecord[]; statusCode: number }> {
    if (userTenantId) {
      this.verifyTenantAccess(userTenantId, tenantId);
    }

    const result = await this.dynamodbConnector.searchColors(tenantId, firstName);
    DEBUG('Found dynamo records: %O', result);
    
    return {
      data: result.map(record => omit(record, ['tenantId', 'sk'])),
      statusCode: 200
    };
  }

  async getColorsByTenant(
    tenantId: string,
    userTenantId?: string
  ): Promise<{ data: ColorRecord[]; statusCode: number }> {
    if (userTenantId) {
      this.verifyTenantAccess(userTenantId, tenantId);
    }

    const result = await this.dynamodbConnector.getColorsByTenant(tenantId);
    DEBUG('Found tenant colors: %O', result);
    
    return {
      data: result.map(record => omit(record, ['tenantId', 'sk'])),
      statusCode: 200
    };
  }
}