import { jest, describe, it, expect, beforeEach, afterAll } from '@jest/globals';
import { DynamoDbConnector } from '../../src/shared/dynamodb';
import { ColorRecord } from '../../src/generated/server';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

type DynamoDBResponse = {
  Item?: ColorRecord | null;
  Items?: ColorRecord[];
  Attributes?: { colors: string[] };
};

describe('DynamoDB Utils', () => {
  let dynamodb: DynamoDbConnector;
  let docClient: DynamoDBDocumentClient;
  let sendSpy: any;

  const mockRecord: ColorRecord = {
    pk: 'John',
    colors: ['blue'],
    timestamp: '2024-01-01T00:00:00.000Z',
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
      expect(result).toEqual({ "colors": ['blue', 'red'] });
      expect(sendSpy).toHaveBeenCalledWith(expect.objectContaining({
        input: {
          TableName: process.env.TABLE_NAME,
          Key: { pk: 'John' },
          UpdateExpression: 'SET colors = list_append(if_not_exists(colors, :empty_list), :new_color)',
          ExpressionAttributeValues: {
            ':empty_list': [],
            ':new_color': ['blue'],
          },
          ReturnValues: 'ALL_NEW',
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
        Attributes: { colors: ['blue'] }
      };
      sendSpy.mockResolvedValue(response);

      // Act
      const result = await dynamodb.saveColor(mockRecord);

      // Assert
      expect(result).toEqual({ colors: ['blue'] });
      expect(sendSpy).toHaveBeenCalledWith(expect.objectContaining({
        input: {
          TableName: process.env.TABLE_NAME,
          Key: { pk: 'John' },
          UpdateExpression: 'SET colors = list_append(if_not_exists(colors, :empty_list), :new_color)',
          ExpressionAttributeValues: {
            ':empty_list': [],
            ':new_color': ['blue'],
          },
          ReturnValues: 'ALL_NEW',
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
        Item: { pk: 'John', colors: ['red'], timestamp: Date.now() }
      };
      sendSpy.mockResolvedValue(response);

      // Act
      const result = await dynamodb.searchColors('John');

      // Assert
      expect(result).toEqual(response.Item);
      expect(sendSpy).toHaveBeenCalledWith(expect.objectContaining({
        input: {
          TableName: process.env.TABLE_NAME,
          Key: { pk: 'John' }
        }
      }));
    });

    it('should handle errors', async () => {
      // Arrange
      const error = new Error('DynamoDB error');
      sendSpy.mockRejectedValue(error);

      // Act & Assert
      await expect(dynamodb.searchColors('John')).rejects.toThrow('DynamoDB error');
    });
  });
}); 