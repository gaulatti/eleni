// buildGetLambda.test.ts

import { Stack } from 'aws-cdk-lib';
import { Table, AttributeType } from 'aws-cdk-lib/aws-dynamodb';
import { Template } from 'aws-cdk-lib/assertions';
import { buildGetLambda } from '../../lib/functions/get';
import { Runtime } from 'aws-cdk-lib/aws-lambda';

describe('buildGetLambda', () => {
  let stack: Stack;
  let table: Table;

  beforeEach(() => {
    stack = new Stack();
    table = new Table(stack, 'TestTable', {
      partitionKey: { name: 'id', type: AttributeType.STRING },
    });
  });

  it('should create a Lambda function with the specified attributes', () => {
    const lambda = buildGetLambda(stack, table);

    const assert = Template.fromStack(stack);
    assert.resourceCountIs('AWS::Lambda::Function', 1);

    assert.hasResourceProperties('AWS::Lambda::Function', {
      FunctionName: 'ArticlesToSpeechGet',
      Handler: 'index.main',
      Runtime: Runtime.NODEJS_LATEST.toString(), // Note: This might change based on what NODEJS_LATEST maps to at the time of testing
      Timeout: 120,
    });

    assert.hasResource('AWS::Lambda::Function', {
      Type: 'AWS::Lambda::Function',
      Properties: {
        Environment: {
          Variables: {
            AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
          },
        },
      },
    });

    // Check if the Lambda function has read and write permissions to the table
    assert.hasResourceProperties('AWS::IAM::Policy', {
      PolicyDocument: {
        Statement: [
          {
            Action: [
              'dynamodb:BatchGetItem',
              'dynamodb:GetRecords',
              'dynamodb:GetShardIterator',
              'dynamodb:Query',
              'dynamodb:GetItem',
              'dynamodb:Scan',
              'dynamodb:ConditionCheckItem',
              'dynamodb:BatchWriteItem',
              'dynamodb:PutItem',
              'dynamodb:UpdateItem',
              'dynamodb:DeleteItem',
              'dynamodb:DescribeTable',
            ],
            Effect: 'Allow',
            Resource: [
              { "Fn::GetAtt": [ "TestTable5769773A", "Arn" ] },
              { "Ref": "AWS::NoValue" }
            ]
          }
        ]
      }
    });
  });
});
