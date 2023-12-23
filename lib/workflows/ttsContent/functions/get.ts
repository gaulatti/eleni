import { Duration, Stack } from 'aws-cdk-lib';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { STACK_NAME } from '../../../consts';

/**
 * Builds and returns a Lambda function for retrieving content to speech.
 *
 * @param stack - The stack object.
 * @param table - The table object.
 * @param bucket - The bucket object.
 * @returns The constructed Lambda function.
 */
const buildGetLambda = (
  stack: Stack,
  table: Table,
  bucket: Bucket
) => {
  const getLambda = new NodejsFunction(
    stack,
    `${STACK_NAME}ContentToSpeechGet`,
    {
      functionName: `${STACK_NAME}ContentToSpeechGet`,
      entry: './src/functions/workflows/content-to-speech/get.ts',
      handler: 'main',
      runtime: Runtime.NODEJS_LATEST,
      timeout: Duration.minutes(2),
      environment: {
        TABLE_NAME: table.tableName,
      },
    }
  );

  bucket.grantRead(getLambda)
  table.grantReadWriteData(getLambda)

  return getLambda;
};

export { buildGetLambda };
