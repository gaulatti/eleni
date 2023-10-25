import { Stack } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { buildTasksTable } from '../../lib/databases/tasks';

describe('buildTasksTable', () => {
  let stack: Stack;

  beforeEach(() => {
    stack = new Stack();
  });

  it('should create a table with the specified attributes', () => {
    buildTasksTable(stack);

    const assert = Template.fromStack(stack);
    assert.resourceCountIs('AWS::DynamoDB::Table', 1);
    assert.hasResourceProperties('AWS::DynamoDB::Table', {
      TableName: 'TasksTable',
      KeySchema: [
        { AttributeName: 'uuid', KeyType: 'HASH' }
      ],
      AttributeDefinitions: [
        { AttributeName: 'uuid', AttributeType: 'S' }
      ],
      BillingMode: 'PAY_PER_REQUEST',
      StreamSpecification: {
        StreamViewType: 'NEW_IMAGE'
      }
    });
  });
});
