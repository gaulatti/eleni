import { Stack } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { buildArticlesTable } from '../../lib/database/articles';

describe('buildArticlesTable', () => {
  let stack: Stack;

  beforeEach(() => {
    stack = new Stack();
  });

  it('should create a table with the specified attributes', () => {
    buildArticlesTable(stack);

    const assert = Template.fromStack(stack);
    assert.resourceCountIs('AWS::DynamoDB::Table', 1);
    assert.hasResourceProperties('AWS::DynamoDB::Table', {
      TableName: 'ArticlesTable',
      KeySchema: [
        { AttributeName: 'uuid', KeyType: 'HASH' }
      ],
      AttributeDefinitions: [
        { AttributeName: 'uuid', AttributeType: 'S' },
        { AttributeName: 'url', AttributeType: 'S' } // The global secondary index attribute
      ],
      BillingMode: 'PAY_PER_REQUEST',
      StreamSpecification: {
        StreamViewType: 'NEW_IMAGE'
      }
    });
  });

  it('should add a global secondary index', () => {
    buildArticlesTable(stack);

    const assert = Template.fromStack(stack);
    assert.hasResourceProperties('AWS::DynamoDB::Table', {
      GlobalSecondaryIndexes: [
        {
          IndexName: 'UrlIndex',
          KeySchema: [
            { AttributeName: 'url', KeyType: 'HASH' }
          ]
        }
      ]
    });
  });
});
