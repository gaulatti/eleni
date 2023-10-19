import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});

let dbInstance: DBClient | null = null;

enum TaskStatus {
  PENDING = 'PENDING',
  DELIVERED = 'DELIVERED',
}

class DBClient {
  private tableName: string;

  constructor() {
    this.tableName = 'TasksTable';
  }

  public async get(uuid: string) {
    const command = new GetCommand({
      TableName: this.tableName,
      Key: {
        uuid,
      },
    });

    const response = await docClient.send(command);
    return response.Item;
  }

  public async create(uuid: string) {
    const Item = {
      uuid,
      article_status: TaskStatus.PENDING,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const command = new PutCommand({
      TableName: this.tableName,
      Item,
    });

    await docClient.send(command);

    return Item
  }

  public async updateStatus(uuid: string, status: TaskStatus) {
    let UpdateExpression =
      'set article_status = :status, updatedAt = :updatedAt';
    let ExpressionAttributeValues: { [k: string]: any } = {
      ':status': status,
      ':updatedAt': new Date().toISOString(),
    };

    return await this.update(uuid, UpdateExpression, ExpressionAttributeValues);
  }

  private async update(
    uuid: string,
    UpdateExpression: string,
    ExpressionAttributeValues?: Record<string, any>
  ) {
    const command = new UpdateCommand({
      TableName: this.tableName,
      Key: {
        uuid,
      },
      UpdateExpression,
      ExpressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    });

    return await docClient.send(command);
  }
}

const getDbInstance = () => {
  if (!dbInstance) {
    dbInstance = new DBClient();
  }

  return dbInstance;
};

export { TaskStatus, getDbInstance };
