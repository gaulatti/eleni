import { DynamoDBClient, QueryCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
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

  public async create(uuid: string, url: string) {
    const command = new PutCommand({
      TableName: this.tableName,
      Item: {
        uuid,
        url,
        article_status: ArticleStatus.PENDING,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });

    await docClient.send(command);

    return { uuid };
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

  public async createMergeJob(
    uuid: string,
    article_id: String,
    url: string,
    language: string
  ) {
    const command = new PutCommand({
      TableName: this.tableName,
      Item: {
        uuid,
        article_id,
        url,
        type: 'merge',
        language,
        article_status: ArticleStatus.RENDERED,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });

    await docClient.send(command);

    return url;
  }

  public async updateTitle(uuid: string, title: string) {
    let UpdateExpression = 'set title = :title, updatedAt = :updatedAt';
    let ExpressionAttributeValues: { [k: string]: any } = {
      ':title': title,
      ':updatedAt': new Date().toISOString(),
    };

    return await this.update(uuid, UpdateExpression, ExpressionAttributeValues);
  }

  public async updateRendered(
    uuid: string,
    outputs: Record<string, { status: string; jobId: string; url: string }>
  ) {
    let UpdateExpression = 'set outputs = :outputs, updatedAt = :updatedAt';
    let ExpressionAttributeValues: { [k: string]: any } = {
      ':outputs': outputs,
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

  public async delete(uuid: string) {
    const command = new DeleteCommand({
      TableName: this.tableName,
      Key: {
        uuid,
      },
    });

    return docClient.send(command);
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

    const response = await docClient.send(command);
    return response.Items?.[0] ? unmarshall(response.Items[0]) : null;
  }
}

const getArticlesTableInstance = () => {
  if (!dbInstance) {
    dbInstance = new DBClient();
  }

  return dbInstance;
};

export { ArticleStatus, getArticlesTableInstance };
