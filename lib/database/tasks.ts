import { Stack } from 'aws-cdk-lib';
import { AttributeType, StreamViewType, Table } from 'aws-cdk-lib/aws-dynamodb';

const buildTasksTable = (stack: Stack) => {
  return new Table(stack, 'TasksTable', {
    tableName: 'TasksTable',
    partitionKey: { name: 'uuid', type: AttributeType.STRING },
    stream: StreamViewType.NEW_IMAGE,
  });
};

export { buildTasksTable };
