import { jest, describe, it, expect, beforeEach, afterAll } from '@jest/globals';
import { DynamoDbConnector } from '../../src/shared/dynamodb';
import { ColorRecord } from '../../src/generated/server';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

interface MultiTenantColorRecord extends ColorRecord {
  tenantId: string;
  sk: string;
}

type DynamoDBResponse = {
  Item?: MultiTenantColorRecord | null;
  Items?: MultiTenantColorRecord[];
  Attributes?: { colors: string[] };
};

describe('DynamoDB Utils', () => {
  let dynamodb: DynamoDbConnector;
  let docClient: DynamoDBDocumentClient;
  let sendSpy: any;
  const TEST_TENANT_ID = 'test-tenant';

  const mockRecord: MultiTenantColorRecord = {
    pk: 'John',
    colors: ['blue'],
    timestamp: '2024-01-01T00:00:00.000Z',
    tenantId: TEST_TENANT_ID,
    sk: 'COLOR#1234567890'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.TABLE_NAME = 'Colors';
    process.env.DEBUG = '*';

    docClient = {
      send: jest.fn(),
    } as unknown as DynamoDBDocumentClient;

    sendSpy = jest.spyOn(docClient, 'send');
    dynamodb = new DynamoDbConnector(docClient);
  });

  describe('initialization', () => {
    const OLD_ENV = process.env;

    beforeEach(() => {
      jest.resetModules();
      process.env = { ...OLD_ENV };
    });

    afterAll(() => {
      process.env = OLD_ENV;
    });

    it('should initialize with TABLE_NAME from environment variable', () => {
      // Arrange
      process.env.TABLE_NAME = 'TestTable';
      
      // Act
      const db = new DynamoDbConnector(docClient);

      // Assert
      expect(db['tableName']).toBe('TestTable');
    });

    it('should initialize with empty string when TABLE_NAME is not set', () => {
      // Arrange
      delete process.env.TABLE_NAME;
      
      // Act
      const db = new DynamoDbConnector(docClient);

      // Assert
      expect(db['tableName']).toBe('');
    });
  });

  describe('getRecord', () => {
    it('should successfully get a record', async () => {
      // Arrange
      const response: DynamoDBResponse = { Item: mockRecord };
      sendSpy.mockResolvedValue(response);

      // Act
      const result = await dynamodb.getRecord('John');

      // Assert
      expect(result).toEqual(mockRecord);
      expect(sendSpy).toHaveBeenCalledWith(expect.objectContaining({
        input: {
          TableName: process.env.TABLE_NAME,
          Key: { pk: 'John' },
        }
      }));
    });

    it('should return null when no record is found', async () => {
      // Arrange
      const response: DynamoDBResponse = { Item: null };
      sendSpy.mockResolvedValue(response);

      // Act
      const result = await dynamodb.getRecord('John');

      // Assert
      expect(result).toEqual(null);
    });

    it('should handle errors', async () => {
      // Arrange
      const error = new Error('DynamoDB error');
      sendSpy.mockRejectedValue(error);

      // Act & Assert
      await expect(dynamodb.getRecord('John')).rejects.toThrow('DynamoDB error');
    });
  });

  describe('saveRecord', () => {
    it('should successfully save a record', async () => {
      // Arrange
      const response: DynamoDBResponse = {};
      sendSpy.mockResolvedValue(response);

      // Act
      await dynamodb.saveRecord(mockRecord);

      // Assert
      expect(sendSpy).toHaveBeenCalledWith(expect.objectContaining({
        input: {
          TableName: process.env.TABLE_NAME,
          Item: mockRecord,
        }
      }));
    });

    it('should handle errors', async () => {
      // Arrange
      const error = new Error('DynamoDB error');
      sendSpy.mockRejectedValue(error);

      // Act & Assert
      await expect(dynamodb.saveRecord(mockRecord)).rejects.toThrow('DynamoDB error');
    });
  });

  describe('updateColors', () => {
    it('should successfully update colors for a record', async () => {
      // Arrange
      const response: DynamoDBResponse = {
        Attributes: { colors: ['blue', 'red'] },
      };
      sendSpy.mockResolvedValue(response);

      // Act
      const result = await dynamodb.saveColor(mockRecord);

      // Assert
      expect(result).toEqual(mockRecord);
      expect(sendSpy).toHaveBeenCalledWith(expect.objectContaining({
        input: {
          TableName: process.env.TABLE_NAME,
          Item: {
            ...mockRecord,
            pk: `TENANT#${TEST_TENANT_ID}#USER#John`,
            sk: expect.stringMatching(/^COLOR#\d+$/),
            timestamp: expect.any(String)
          },
          ConditionExpression: 'attribute_not_exists(pk)'
        }
      }));
    });

    it('should handle errors', async () => {
      // Arrange
      const error = new Error('DynamoDB error');
      sendSpy.mockRejectedValue(error);

      // Act & Assert
      await expect(dynamodb.saveColor(mockRecord)).rejects.toThrow('DynamoDB error');
    });
  });

  describe('saveColor', () => {
    it('should successfully add a color', async () => {
      // Arrange
      const response: DynamoDBResponse = {
        Item: mockRecord
      };
      sendSpy.mockResolvedValue(response);

      // Act
      const result = await dynamodb.saveColor(mockRecord);

      // Assert
      expect(result).toEqual(mockRecord);
      expect(sendSpy).toHaveBeenCalledWith(expect.objectContaining({
        input: {
          TableName: process.env.TABLE_NAME,
          Item: {
            ...mockRecord,
            pk: `TENANT#${TEST_TENANT_ID}#USER#John`,
            sk: expect.stringMatching(/^COLOR#\d+$/),
            timestamp: expect.any(String)
          },
          ConditionExpression: 'attribute_not_exists(pk)'
        }
      }));
    });

    it('should handle errors', async () => {
      // Arrange
      const error = new Error('DynamoDB error');
      sendSpy.mockRejectedValue(error);

      // Act & Assert
      await expect(dynamodb.saveColor(mockRecord)).rejects.toThrow('DynamoDB error');
    });
  });

  describe('searchColors', () => {
    it('should successfully search colors with a pk', async () => {
      // Arrange
      const response = {
        Items: [mockRecord]
      };
      sendSpy.mockResolvedValue(response);

      // Act
      const result = await dynamodb.searchColors(TEST_TENANT_ID, 'John');

      // Assert
      expect(result).toEqual([mockRecord]);
      expect(sendSpy).toHaveBeenCalledWith(expect.objectContaining({
        input: {
          TableName: process.env.TABLE_NAME,
          IndexName: 'TenantIndex',
          KeyConditionExpression: 'tenantId = :tenantId',
          ExpressionAttributeValues: {
            ':tenantId': TEST_TENANT_ID,
            ':pk': 'John'
          },
          FilterExpression: 'pk = :pk'
        }
      }));
    });

    it('should handle errors', async () => {
      // Arrange
      const error = new Error('DynamoDB error');
      sendSpy.mockRejectedValue(error);

      // Act & Assert
      await expect(dynamodb.searchColors(TEST_TENANT_ID, 'John')).rejects.toThrow('DynamoDB error');
    });
  });
}); 