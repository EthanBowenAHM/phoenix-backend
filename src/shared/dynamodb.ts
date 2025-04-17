import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { 
  DynamoDBDocumentClient, 
  GetCommand, 
  PutCommand, 
  UpdateCommand,
  QueryCommand,
  QueryCommandInput
} from '@aws-sdk/lib-dynamodb';
import { ColorRecord } from '@generated/server';

import DEBUG from './debug';

interface MultiTenantColorRecord extends ColorRecord {
  tenantId: string;
  sk: string;
}

interface AWSCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;
}

export class DynamoDbConnector {
  private docClient: DynamoDBDocumentClient;
  private tableName: string;

  constructor(client?: DynamoDBDocumentClient, credentials?: AWSCredentials) {
    if (client) {
      this.docClient = client;
    } else {
      const ddbClient = new DynamoDBClient({
        credentials: credentials ? {
          accessKeyId: credentials.accessKeyId,
          secretAccessKey: credentials.secretAccessKey,
          sessionToken: credentials.sessionToken
        } : undefined
      });
      this.docClient = DynamoDBDocumentClient.from(ddbClient);
    }
    this.tableName = process.env.TABLE_NAME || '';
  }

  private generatePartitionKey(tenantId: string, firstName: string): string {
    return `TENANT#${tenantId}#USER#${firstName}`;
  }

  private generateSortKey(): string {
    return `COLOR#${Date.now()}`;
  }

  async getRecord(pk: string): Promise<ColorRecord | null> {
    try {
      const result = await this.docClient.send(new GetCommand({
        TableName: this.tableName,
        Key: { pk }
      }));

      DEBUG('Get record result: %O', result);
      return result.Item as ColorRecord || null;
    } catch (error) {
      DEBUG('Error getting record: %O', error);
      console.error('Error getting record:', error);
      throw error;
    }
  }

  async saveRecord(record: ColorRecord): Promise<void> {
    try {
      await this.docClient.send(new PutCommand({
        TableName: this.tableName,
        Item: record
      }));

      DEBUG('Record saved successfully');
    } catch (error) {
      DEBUG('Error saving record: %O', error);
      console.error('Error saving record:', error);
      throw error;
    }
  }

  async saveColor(record: MultiTenantColorRecord): Promise<MultiTenantColorRecord> {
    try {
      const pk = this.generatePartitionKey(record.tenantId, record.pk);
      const sk = this.generateSortKey();

      const result = await this.docClient.send(new PutCommand({
        TableName: this.tableName,
        Item: {
          ...record,
          pk,
          sk,
          timestamp: new Date().toISOString()
        },
        ConditionExpression: 'attribute_not_exists(pk)'
      }));

      DEBUG('Save color result: %O', result);
      return { ...record, pk, sk };
    } catch (error) {
      DEBUG('Error saving color: %O', error);
      console.error('Error saving color:', error);
      throw error;
    }
  }

  async searchColors(tenantId: string, firstName?: string): Promise<MultiTenantColorRecord[]> {
    try {
      const queryParams: QueryCommandInput = {
        TableName: this.tableName,
        IndexName: 'TenantIndex',
        KeyConditionExpression: 'tenantId = :tenantId',
        ExpressionAttributeValues: {
          ':tenantId': tenantId
        }
      };

      if (firstName) {
        queryParams.FilterExpression = 'pk = :pk';
        if (!queryParams.ExpressionAttributeValues) {
          queryParams.ExpressionAttributeValues = {};
        }
        queryParams.ExpressionAttributeValues[':pk'] = firstName;
      }

      const result = await this.docClient.send(new QueryCommand(queryParams));
      DEBUG('Search results: %O', result);

      return result.Items as MultiTenantColorRecord[];
    } catch (error) {
      DEBUG('Error searching colors: %O', error);
      console.error('Error searching colors:', error);
      throw error;
    }
  }

  async getColorsByTenant(tenantId: string): Promise<MultiTenantColorRecord[]> {
    try {
      const result = await this.docClient.send(new QueryCommand({
        TableName: this.tableName,
        IndexName: 'TenantIndex',
        KeyConditionExpression: 'tenantId = :tenantId',
        ExpressionAttributeValues: {
          ':tenantId': tenantId
        }
      }));

      DEBUG('Get colors by tenant result: %O', result);
      return result.Items as MultiTenantColorRecord[];
    } catch (error) {
      DEBUG('Error getting colors by tenant: %O', error);
      console.error('Error getting colors by tenant:', error);
      throw error;
    }
  }
}