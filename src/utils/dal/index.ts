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
  BUILT = 'BUILT',
  READY = 'READY',
  FAILED = 'FAILED',
}

class DBClient {
  private tableName: string;

  constructor() {
    this.tableName = 'ArticlesToSpeechTable';
  }

  public async list() {
    const command = new ScanCommand({
      TableName: this.tableName,
    });

    const response = await docClient.send(command);

    return response.Items;
  }

  public async get(url: string) {
    const command = new GetCommand({
      TableName: this.tableName,
      Key: {
        url,
      },
    });

    const response = await docClient.send(command);
    return response.Item;
  }

  public async create(url: string, title: string) {
    const command = new PutCommand({
      TableName: this.tableName,
      Item: {
        url,
        article_status: ArticleStatus.PENDING,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });

    await docClient.send(command);

    return url;
  }

  public async update(url: string, status: ArticleStatus, audio_url: string) {
    let UpdateExpression =
      'set instance_status = :status, updatedAt = :updatedAt';
    let ExpressionAttributeValues: { [k: string]: any } = {
      ':status': status,
      ':updatedAt': new Date().toISOString(),
    };

    if (audio_url) {
      UpdateExpression = `${UpdateExpression}, audio_url = :audio_url`;
      ExpressionAttributeValues[':audio_url'] = audio_url;
    }

    const command = new UpdateCommand({
      TableName: this.tableName,
      Key: {
        url,
      },
      UpdateExpression,
      ExpressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    });

    return await docClient.send(command);
  }

  public async delete(url: string) {
    const command = new DeleteCommand({
      TableName: this.tableName,
      Key: {
        url,
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
