import { getTasksTableInstance } from '../../../src/utils/dal/tasks';
import { GetCommand } from '@aws-sdk/lib-dynamodb';

// Mocking AWS SDK
jest.mock('@aws-sdk/lib-dynamodb', () => {
  const originalModule = jest.requireActual('@aws-sdk/lib-dynamodb');

  return {
    ...originalModule,
    DynamoDBDocumentClient: {
      ...originalModule.DynamoDBDocumentClient,
      from: jest.fn().mockImplementation(() => ({
        send: jest.fn().mockImplementation(() => ({
          Items: [{
            uuid: 'test-uuid-1',
          },
          {
            uuid: 'test-uuid-2',
          }],
        })),
      })),
    },
    GetCommand: jest.fn(),
  };
});


jest.mock('@aws-sdk/lib-dynamodb', () => {
  return {
    DynamoDBDocumentClient: {
      from: jest.fn().mockReturnValue({
        send: jest.fn(),
      }),
    },
    GetCommand: jest.fn(),
  };
});

describe('DBClient', () => {
  let dbClient: any;

  beforeEach(() => {
    dbClient = getTasksTableInstance();
  });

  describe('get', () => {
    it('should fetch an item by uuid', async () => {
      // Given
      const mockUuid = 'sampleUuid';
      const mockItem = { uuid: mockUuid, someOtherAttribute: 'value' };

      // Mock out the response of the send function
      const mockedDynamoDB = require('@aws-sdk/lib-dynamodb');
      mockedDynamoDB.DynamoDBDocumentClient.from().send.mockResolvedValue({
        Item: mockItem,
      });

      // When
      const result = await dbClient.get(mockUuid);

      // Then
      expect(result).toEqual(mockItem);

      // Ensure that GetCommand was called with the right arguments
      expect(mockedDynamoDB.GetCommand).toHaveBeenCalledWith({
        TableName: 'TasksTable', // Replace with your table name if it's different
        Key: {
          uuid: mockUuid,
        },
      });

      // Ensure the send method was called on the docClient
      expect(
        mockedDynamoDB.DynamoDBDocumentClient.from().send
      ).toHaveBeenCalledTimes(1);
    });
  });
});
