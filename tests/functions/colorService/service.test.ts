import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { ColorService } from '../../../src/functions/colorService/service';
import { ColorSubmission, ColorRecord } from '../../../src/generated/server';
import { DynamoDbConnector } from '../../../src/shared/dynamodb';

//jest.mock('../../../src/shared/dynamodb');

describe('ColorService', () => {
  let service: ColorService;
  let dynamodb: DynamoDbConnector;
  let saveColorSubmissionSpy: any;
  let searchColorsSpy: any;

  beforeEach(() => {
    jest.clearAllMocks();

    dynamodb = new DynamoDbConnector();
    saveColorSubmissionSpy = jest.spyOn(dynamodb, 'saveColor');
    searchColorsSpy = jest.spyOn(dynamodb, 'searchColors');

    service = new ColorService(dynamodb);
  });

  describe('submitColor', () => {
    it('should successfully submit a color', async () => {
      // Arrange
      const submission: ColorSubmission = {
        firstName: 'John',
        color: 'blue',
      };
      const mockRecord: ColorRecord = {
        pk: 'John',
        colors: ['blue'],
        timestamp: expect.any(String) as unknown as string
      };
      saveColorSubmissionSpy.mockResolvedValue(mockRecord as never);

      // Act
      const result = await service.saveColor(submission);

      // Assert
      expect(result).toEqual({
        data: mockRecord,
        statusCode: 201,
      });
      expect(saveColorSubmissionSpy).toHaveBeenCalledWith({
        pk: 'John',
        colors: ['blue'],
        timestamp: expect.any(String)
      });
    });

    it('should handle errors from saveColorSubmission', async () => {
      // Arrange
      const submission: ColorSubmission = {
        firstName: 'John',
        color: 'blue',
      };
      saveColorSubmissionSpy.mockRejectedValue(new Error('DynamoDB error') as never);

      // Act & Assert
      await expect(service.saveColor(submission)).rejects.toThrow('DynamoDB error');
    });
  });

  describe('searchColors', () => {
    it('should successfully search colors by firstName', async () => {
      // Arrange
      const firstName = 'John';
      const mockRecords: ColorRecord[] = [
        {
          pk: 'John',
          colors: ['blue'],
          timestamp: '2024-01-01T00:00:00.000Z',
        },
      ];
      searchColorsSpy.mockResolvedValue(mockRecords as never);

      // Act
      const result = await service.searchColors(firstName);

      // Assert
      expect(result).toEqual({
        data: mockRecords,
        statusCode: 200,
      });
      expect(searchColorsSpy).toHaveBeenCalledWith(firstName);
    });

    it('should handle errors from searchColors', async () => {
      // Arrange
      const firstName = 'John';
      searchColorsSpy.mockRejectedValue(new Error('DynamoDB error') as never);

      // Act & Assert
      await expect(service.searchColors(firstName)).rejects.toThrow('DynamoDB error');
    });
  });
}); 