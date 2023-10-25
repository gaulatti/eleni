import {
  DynamoDBClient,
  QueryCommand,
  ScanCommand,
} from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';

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

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  public async list() {
    const command = new ScanCommand({
      TableName: this.tableName,
    });

    const response = await docClient.send(command);

    if (response.Items) {
      return response.Items?.map((item) => unmarshall(item));
    }

    return [];
  }

  public async get(uuid: string | null | undefined) {
    if (!uuid) return null;

    const command = new GetCommand({
      TableName: this.tableName,
      Key: {
        uuid,
      },
    });

    const response = await docClient.send(command);
    return response.Item;
  }

  public async create(uuid: string, url: string, token: string, ttl: number) {
    const command = new PutCommand({
      TableName: this.tableName,
      Item: {
        uuid,
        url,
        token,
        ttl,
        task_status: TaskStatus.PENDING,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });

    await docClient.send(command);

    return { uuid, url };
  }

  public async updateStatus(uuid: string, status: TaskStatus) {
    let UpdateExpression = 'set task_status = :status, updatedAt = :updatedAt';
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

  public async queryByUrl(url: string | null | undefined) {
    if (!url) return null;
    const command = new QueryCommand({
      TableName: this.tableName,
      IndexName: 'UrlIndex',
      KeyConditionExpression: '#urlAttribute = :urlVal',
      ExpressionAttributeNames: {
        '#urlAttribute': 'url',
      },
      ExpressionAttributeValues: {
        ':urlVal': { S: url },
      },
    });

    console.log({ command: JSON.stringify(command) });

    const response = await docClient.send(command);
    console.log({ response: JSON.stringify(response) });

    return response.Items?.[0] ? unmarshall(response.Items[0]) : null;
  }
}

const getTasksTableInstance = (tableName: string) => {
  if (!dbInstance) {
    dbInstance = new DBClient(tableName);
  }

  return dbInstance;
};

export { TaskStatus, getTasksTableInstance };
