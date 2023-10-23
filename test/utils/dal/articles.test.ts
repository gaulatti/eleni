import { getArticlesTableInstance } from '../../../src/utils/dal/articles';

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

describe('DBClient via getArticlesTableInstance', () => {
  let dbInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();
    dbInstance = getArticlesTableInstance();
  });

  describe('list', () => {
    it('should fetch all items from the table', async () => {
      const items = await dbInstance.list();

      expect(items).toHaveLength(2);
      expect(items[0].uuid).toEqual('test-uuid-1');
    });
  });
});
