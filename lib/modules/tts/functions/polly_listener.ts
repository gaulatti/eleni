import { Duration, Stack } from 'aws-cdk-lib';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { STACK_NAME } from '../../../consts';

const buildPollyListenerLambda = (stack: Stack, table: Table) => {
  const pollyListenerLambda = new NodejsFunction(
    stack,
    `${STACK_NAME}TextToSpeechPollyListenerLambda`,
    {
      functionName: `${STACK_NAME}TextToSpeechPollyListener`,
      entry: './src/functions/tts/polly_listener.ts',
      handler: 'main',
      runtime: Runtime.NODEJS_LATEST,
      timeout: Duration.minutes(1),
    }
  );

  table.grantReadWriteData(pollyListenerLambda);

  return pollyListenerLambda;
};

export { buildPollyListenerLambda };
