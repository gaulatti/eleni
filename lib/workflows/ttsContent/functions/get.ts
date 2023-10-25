import { Duration, Stack } from 'aws-cdk-lib';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { STACK_NAME } from '../../../consts';
const buildGetLambda = (
  stack: Stack,
  table: Table,
  bucket: Bucket
) => {
  const getLambda = new NodejsFunction(stack, `${STACK_NAME}ContentToSpeechGet`, {
    functionName: `${STACK_NAME}ContentToSpeechGet`,
    entry: './src/functions/workflows/content-to-speech/get.ts',
    handler: 'main',
    runtime: Runtime.NODEJS_LATEST,
    timeout: Duration.minutes(2),
  });

  bucket.grantRead(getLambda)
  table.grantReadWriteData(getLambda)

  return getLambda;
};

export { buildGetLambda };
