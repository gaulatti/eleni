import { Duration, Stack } from 'aws-cdk-lib';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

const buildTaskCreateLambda = (
  stack: Stack,
  table: Table,
) => {
  const listLambda = new NodejsFunction(stack, `ArticlesToSpeechTaskCreate`, {
    functionName: `ArticlesToSpeechTaskCreate`,
    entry: './src/functions/task_wait.ts',
    handler: 'main',
    runtime: Runtime.NODEJS_LATEST,
    timeout: Duration.minutes(1),
  });

  table.grantReadWriteData(listLambda)

  return listLambda;
};

export { buildTaskCreateLambda };
