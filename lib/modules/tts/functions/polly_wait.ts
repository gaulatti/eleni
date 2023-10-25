import { Duration, Stack } from 'aws-cdk-lib';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

const buildPollyWaitLambda = (stack: Stack, table: Table) => {
  const pollyWaitLambda = new NodejsFunction(stack, `ArticlesToSpeechPollyWaitLambda`, {
    functionName: `ArticlesToSpeechPollyWait`,
    entry: './src/functions/polly_wait.ts',
    handler: 'main',
    runtime: Runtime.NODEJS_LATEST,
    timeout: Duration.minutes(1),
  });

  table.grantReadWriteData(pollyWaitLambda);

  return pollyWaitLambda;
};

export { buildPollyWaitLambda };
