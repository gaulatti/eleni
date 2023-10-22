import { Duration, Stack } from 'aws-cdk-lib';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

const buildListLambda = (
  stack: Stack,
  table: Table,
) => {
  const listLambda = new NodejsFunction(stack, `ArticlesToSpeechList`, {
    functionName: `ArticlesToSpeechList`,
    entry: './src/functions/list.ts',
    handler: 'main',
    runtime: Runtime.NODEJS_LATEST,
    timeout: Duration.minutes(1),
  });

  table.grantReadData(listLambda)

  return listLambda;
};

export { buildListLambda };
