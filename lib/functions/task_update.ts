import { Duration, Stack } from 'aws-cdk-lib';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import { Rule } from 'aws-cdk-lib/aws-events';
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets';
import { ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

const buildTaskUpdateLambda = (stack: Stack, table: Table) => {
  const taskUpdateLambda = new NodejsFunction(stack, `ArticlesToSpeechTaskUpdate`, {
    functionName: `ArticlesToSpeechTaskUpdate`,
    entry: './src/functions/task_update.ts',
    handler: 'main',
    runtime: Runtime.NODEJS_LATEST,
    timeout: Duration.minutes(1),
  });

  const rule = new Rule(stack, 'ArticlesToSpeechWaitMediaConvertRule', {
    eventPattern: {
      source: ['aws.polly'],
    },
  });

  taskUpdateLambda.addPermission('ArticlesToSpeechWaitEventBridgePermission', {
    principal: new ServicePrincipal('events.amazonaws.com'),
    sourceArn: rule.ruleArn,
  });

  rule.addTarget(new LambdaFunction(taskUpdateLambda));
  table.grantReadWriteData(taskUpdateLambda);

  return taskUpdateLambda;
};

export { buildTaskUpdateLambda };
