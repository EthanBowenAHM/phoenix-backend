import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { ColorService } from '../../../src/functions/colorService/service';
import { ColorSubmission, ColorRecord } from '../../../src/generated/server';
import { DynamoDbConnector } from '../../../src/shared/dynamodb';

interface MultiTenantColorSubmission extends ColorSubmission {
  tenantId: string;
}

//jest.mock('../../../src/shared/dynamodb');

describe('ColorService', () => {
  let service: ColorService;
  let dynamodb: DynamoDbConnector;
  let saveColorSubmissionSpy: any;
  let searchColorsSpy: any;
  const TEST_TENANT_ID = 'test-tenant';

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
      const submission: MultiTenantColorSubmission = {
        firstName: 'John',
        color: 'blue',
        tenantId: TEST_TENANT_ID
      };
      const mockRecord: ColorRecord = {
        pk: 'John',
        colors: ['blue'],
        timestamp: expect.any(String) as unknown as string
      };
      saveColorSubmissionSpy.mockResolvedValue(mockRecord as never);

      // Act
      const result = await service.saveColor(submission, TEST_TENANT_ID);

      // Assert
      expect(result).toEqual({
        data: mockRecord,
        statusCode: 201,
      });
      expect(saveColorSubmissionSpy).toHaveBeenCalledWith({
        pk: 'John',
        sk: expect.stringMatching(/^COLOR#\d+$/),
        tenantId: TEST_TENANT_ID,
        firstName: 'John',
        color: 'blue',
        colors: ['blue'],
        timestamp: expect.any(String)
      });
    });

    it('should handle errors from saveColorSubmission', async () => {
      // Arrange
      const submission: MultiTenantColorSubmission = {
        firstName: 'John',
        color: 'blue',
        tenantId: TEST_TENANT_ID
      };
      saveColorSubmissionSpy.mockRejectedValue(new Error('DynamoDB error') as never);

      // Act & Assert
      await expect(service.saveColor(submission, TEST_TENANT_ID)).rejects.toThrow('DynamoDB error');
    });

    it('should throw error when tenant IDs do not match', async () => {
      // Arrange
      const submission: MultiTenantColorSubmission = {
        firstName: 'John',
        color: 'blue',
        tenantId: 'different-tenant'
      };

      // Act & Assert
      await expect(service.saveColor(submission, TEST_TENANT_ID)).rejects.toThrow('Unauthorized access to tenant');
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
      const result = await service.searchColors(TEST_TENANT_ID, firstName, TEST_TENANT_ID);

      // Assert
      expect(result).toEqual({
        data: mockRecords,
        statusCode: 200,
      });
      expect(searchColorsSpy).toHaveBeenCalledWith(TEST_TENANT_ID, firstName);
    });

    it('should handle errors from searchColors', async () => {
      // Arrange
      const firstName = 'John';
      searchColorsSpy.mockRejectedValue(new Error('DynamoDB error') as never);

      // Act & Assert
      await expect(service.searchColors(TEST_TENANT_ID, firstName, TEST_TENANT_ID)).rejects.toThrow('DynamoDB error');
    });

    it('should throw error when tenant IDs do not match', async () => {
      // Act & Assert
      await expect(service.searchColors('different-tenant', 'John', TEST_TENANT_ID)).rejects.toThrow('Unauthorized access to tenant');
    });
  });
}); 