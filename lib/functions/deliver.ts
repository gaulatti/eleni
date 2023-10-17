import { Duration, Stack } from 'aws-cdk-lib';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import { Rule } from 'aws-cdk-lib/aws-events';
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets';
import { ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

const buildDeliverLambda = (stack: Stack, table: Table) => {
  const deliverLambda = new NodejsFunction(stack, `ArticlesToSpeechDeliverLambda`, {
    functionName: `ArticlesToSpeechDeliver`,
    entry: './src/functions/deliver.ts',
    handler: 'main',
    runtime: Runtime.NODEJS_LATEST,
    timeout: Duration.minutes(1),
  });

  const rule = new Rule(stack, 'ArticlesToSpeechDeliverMediaConvertRule', {
    eventPattern: {
      source: ['aws.mediaconvert'],
      detailType: ['MediaConvert Job State Change'],
      detail: {
        status: ['COMPLETE', 'ERROR'],
      },
    },
  });

  deliverLambda.addPermission('ArticlesToSpeechDeliverEventBridgePermission', {
    principal: new ServicePrincipal('events.amazonaws.com'),
    sourceArn: rule.ruleArn,
  });

  rule.addTarget(new LambdaFunction(deliverLambda));
  table.grantReadWriteData(deliverLambda);

  return deliverLambda;
};

export { buildDeliverLambda };
