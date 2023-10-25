import { Duration, Stack } from 'aws-cdk-lib';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { STACK_NAME } from '../../../consts';

const buildPollyWaitLambda = (stack: Stack, table: Table) => {
  const pollyWaitLambda = new NodejsFunction(
    stack,
    `${STACK_NAME}TextToSpeechPollyWaitLambda`,
    {
      functionName: `${STACK_NAME}TextToSpeechPollyWait`,
      entry: './src/functions/tts/polly_wait.ts',
      handler: 'main',
      runtime: Runtime.NODEJS_LATEST,
      timeout: Duration.minutes(1),
      environment: {
        TABLE_NAME: table.tableName,
      }
    }
  );

  table.grantReadWriteData(pollyWaitLambda);

  return pollyWaitLambda;
};

export { buildPollyWaitLambda };
