import { Stack } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { AttributeType, Table } from 'aws-cdk-lib/aws-dynamodb';
import { buildDeliverLambda } from '../../lib/functions/deliver';
import { Runtime } from 'aws-cdk-lib/aws-lambda';

describe('buildDeliverLambda', () => {
  let stack: Stack;
  let table: Table;

  beforeEach(() => {
    stack = new Stack();
    table = new Table(stack, 'TestTable', {
      partitionKey: {
        name: 'id',
        type: AttributeType.STRING,
      },
    });
  });

  it('should create ArticlesToSpeechDeliverLambda with the expected properties', () => {
    buildDeliverLambda(stack, table);
    const assertTemplate = Template.fromStack(stack);

    assertTemplate.resourceCountIs('AWS::Lambda::Function', 1);
    assertTemplate.hasResourceProperties('AWS::Lambda::Function', {
      Handler: 'index.main',
      Runtime: Runtime.NODEJS_LATEST.toString(), // To handle any latest runtime string
      FunctionName: 'ArticlesToSpeechDeliver',
    });
  });

  it('should create the expected EventBridge rule', () => {
    buildDeliverLambda(stack, table);
    const assertTemplate = Template.fromStack(stack);

    assertTemplate.resourceCountIs('AWS::Events::Rule', 1);
    assertTemplate.hasResourceProperties('AWS::Events::Rule', {
      EventPattern: {
        source: ['aws.mediaconvert'],
        detail: {
          status: ['COMPLETE', 'ERROR'],
        },
      },
    });
  });

  it('should grant lambda permission to be invoked by EventBridge', () => {
    buildDeliverLambda(stack, table);
    const assertTemplate = Template.fromStack(stack);

    assertTemplate.hasResourceProperties('AWS::Lambda::Permission', {
      Principal: 'events.amazonaws.com',
    });
  });

  it('should grant lambda read/write access to the table', () => {
    buildDeliverLambda(stack, table);
    const assertTemplate = Template.fromStack(stack);

    assertTemplate.hasResourceProperties('AWS::IAM::Policy', {
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
          },
        ],
      },
    });
  });
});
