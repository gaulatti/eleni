import { Duration, Stack } from 'aws-cdk-lib';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
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

  return deliverLambda;
};

export { buildDeliverLambda };
