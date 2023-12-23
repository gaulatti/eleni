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

/**
 * Represents a database client for interacting with tasks.
 */
class DBClient {
  private tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  /**
   * Retrieves a list of tasks from the database.
   * @returns {Promise<Task[]>} A promise that resolves to an array of tasks.
   */
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

  /**
   * Retrieves a task from the database based on the provided UUID.
   * @param uuid - The UUID of the task to retrieve.
   * @returns The retrieved task object, or null if the UUID is falsy.
   */
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

  /**
   * Creates a new task with the specified parameters.
   * @param uuid - The UUID of the task.
   * @param url - The URL associated with the task.
   * @param token - The token for the task.
   * @param ttl - The time-to-live value for the task.
   * @returns An object containing the UUID and URL of the created task.
   */
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

  /**
   * Updates the status of a task.
   * @param uuid - The UUID of the task.
   * @param status - The new status of the task.
   * @returns A promise that resolves to the updated task.
   */
  public async updateStatus(uuid: string, status: TaskStatus) {
    let UpdateExpression = 'set task_status = :status, updatedAt = :updatedAt';
    let ExpressionAttributeValues: { [k: string]: any } = {
      ':status': status,
      ':updatedAt': new Date().toISOString(),
    };

    return await this.update(uuid, UpdateExpression, ExpressionAttributeValues);
  }

  /**
   * Updates a record in the database.
   * 
   * @param uuid - The unique identifier of the record.
   * @param UpdateExpression - The update expression to modify the record.
   * @param ExpressionAttributeValues - Optional. The attribute values used in the update expression.
   * @returns A promise that resolves to the updated record.
   */
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

  /**
   * Queries the database by URL and returns the corresponding item.
   * @param url - The URL to query by.
   * @returns The item corresponding to the URL, or null if not found.
   */
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

/**
 * Returns an instance of the tasks table from the database.
 * If the instance does not exist, it creates a new one.
 * @param tableName - The name of the tasks table.
 * @returns The tasks table instance.
 */
const getTasksTableInstance = (tableName: string) => {
  if (!dbInstance) {
    dbInstance = new DBClient(tableName);
  }

  return dbInstance;
};

export { TaskStatus, getTasksTableInstance };
