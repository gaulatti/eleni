import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  ScanCommand,
  GetCommand,
  DeleteCommand,
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

enum ArticleStatus {
  PENDING = 'PENDING',
  RENDERED = 'RENDERED',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
}

class DBClient {
  private tableName: string;

  constructor() {
    this.tableName = 'ArticlesTable';
  }

  public async list() {
    const command = new ScanCommand({
      TableName: this.tableName,
    });

    const response = await docClient.send(command);

    return response.Items;
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

  public async create(uuid: string, url: string, title: string) {
    const command = new PutCommand({
      TableName: this.tableName,
      Item: {
        uuid,
        url,
        title,
        article_status: ArticleStatus.PENDING,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });

    await docClient.send(command);

    return url;
  }

  public async updateStatus(uuid: string, status: ArticleStatus) {
    let UpdateExpression =
      'set article_status = :status, updatedAt = :updatedAt';
    let ExpressionAttributeValues: { [k: string]: any } = {
      ':status': status,
      ':updatedAt': new Date().toISOString(),
    };

    return await this.update(uuid, UpdateExpression, ExpressionAttributeValues);
  }

  public async updateRendered(uuid: string, mergeJob: String, audio_url: String) {
    let UpdateExpression =
      'set article_status = :status, mergeId = :mergeId, audio_url: String, updatedAt = :updatedAt';
    let ExpressionAttributeValues: { [k: string]: any } = {
      ':status': ArticleStatus.RENDERED,
      ':audio_url': audio_url,
      ':mergeId': mergeJob,
      ':updatedAt': new Date().toISOString(),
    };

    return await this.update(uuid, UpdateExpression, ExpressionAttributeValues);
  }

  private async update(uuid: string, UpdateExpression: string, ExpressionAttributeValues?: Record<string, any>) {
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

  public async delete(uuid: string) {
    const command = new DeleteCommand({
      TableName: this.tableName,
      Key: {
        uuid,
      },
    });

    return docClient.send(command);
  }
}

const getDbInstance = () => {
  if (!dbInstance) {
    dbInstance = new DBClient();
  }

  return dbInstance;
};

export { ArticleStatus, getDbInstance };
