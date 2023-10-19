import { Duration, Stack } from 'aws-cdk-lib';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { languages } from '../languages';
const buildGetLambda = (
  stack: Stack,
  table: Table,
) => {
  const getLambda = new NodejsFunction(stack, `ArticlesToSpeechGet`, {
    functionName: `ArticlesToSpeechGet`,
    entry: './src/functions/get.ts',
    handler: 'main',
    runtime: Runtime.NODEJS_LATEST,
    timeout: Duration.minutes(2),
    environment: {
      LANGUAGES: JSON.stringify(languages.wave1),
    },
  });

  table.grantReadWriteData(getLambda)

  return getLambda;
};

export { buildGetLambda };
