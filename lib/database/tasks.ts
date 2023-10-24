import { Stack } from 'aws-cdk-lib';
import {
  AttributeType,
  BillingMode,
  StreamViewType,
  Table,
} from 'aws-cdk-lib/aws-dynamodb';

const buildTasksTable = (stack: Stack) => {
  const table: Table = new Table(stack, 'TasksTable', {
    tableName: 'TasksTable',
    partitionKey: { name: 'uuid', type: AttributeType.STRING },
    stream: StreamViewType.NEW_IMAGE,
    billingMode: BillingMode.PAY_PER_REQUEST,
    timeToLiveAttribute: 'ttl',
  });

  table.addGlobalSecondaryIndex({
    indexName: 'UrlIndex',
    partitionKey: { name: 'url', type: AttributeType.STRING },
  });

  return table;
};

export { buildTasksTable };
