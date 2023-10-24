import { Duration, Stack } from 'aws-cdk-lib';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

const buildPollyListenerLambda = (stack: Stack, table: Table) => {
  const pollyListenerLambda = new NodejsFunction(
    stack,
    `ArticlesToSpeechPollyListenerLambda`,
    {
      functionName: `ArticlesToSpeechPollyListener`,
      entry: './src/functions/polly_listener.ts',
      handler: 'main',
      runtime: Runtime.NODEJS_LATEST,
      timeout: Duration.minutes(1),
    }
  );

  table.grantReadWriteData(pollyListenerLambda);

  return pollyListenerLambda;
};

export { buildPollyListenerLambda };
