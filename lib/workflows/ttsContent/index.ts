import { Stack } from 'aws-cdk-lib';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { buildGetLambda } from './functions/get';
import { buildTriggerLambda } from './functions/trigger';
import { buildPollyWorkflow } from './machine';

const buildTtsContentWorkflow = (
  stack: Stack,
  bucket: Bucket,
  contentTable: Table,
  preTranslateLambda: NodejsFunction,
  prePollyLambda: NodejsFunction,
  mergeFilesLambda: NodejsFunction,
  pollyWaitLambda: NodejsFunction,
  pollyListenerLambda: NodejsFunction
) => {
  const workflow = buildPollyWorkflow(
    stack,
    bucket,
    preTranslateLambda,
    prePollyLambda,
    mergeFilesLambda,
    pollyWaitLambda,
    pollyListenerLambda
  );

  const triggerLambda = buildTriggerLambda(stack, contentTable, workflow);
  const getLambda = buildGetLambda(stack, contentTable, bucket);

  return { getLambda };
};

export { buildTtsContentWorkflow };
