import { Stack } from 'aws-cdk-lib';
import {
  AttributeType,
  BillingMode,
  StreamViewType,
  Table,
} from 'aws-cdk-lib/aws-dynamodb';
import { STACK_NAME } from '../consts';

const buildContentTable = (stack: Stack) => {
  const table: Table = new Table(stack, `${STACK_NAME}ContentTable`, {
    tableName: `${STACK_NAME}ContentTable`,
    partitionKey: { name: 'uuid', type: AttributeType.STRING },
    stream: StreamViewType.NEW_IMAGE,
    billingMode: BillingMode.PAY_PER_REQUEST,
  });

  table.addGlobalSecondaryIndex({
    indexName: 'UrlIndex',
    partitionKey: { name: 'url', type: AttributeType.STRING },
  });

  return table;
};

export { buildContentTable };