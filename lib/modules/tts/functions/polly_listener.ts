import { Duration, Stack } from 'aws-cdk-lib';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { STACK_NAME } from '../../../consts';

/**
 * Builds and returns a NodejsFunction for the Polly Listener Lambda.
 *
 * @param stack - The stack object.
 * @param table - The table object.
 * @returns The Polly Listener Lambda function.
 */
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
      environment: {
        TABLE_NAME: table.tableName,
      },
    }
  );

  table.grantReadWriteData(pollyListenerLambda);

  return pollyListenerLambda;
};

export { buildPollyListenerLambda };
