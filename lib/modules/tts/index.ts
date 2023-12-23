import { Stack } from 'aws-cdk-lib';
import { buildBucket } from './assets/bucket';
import { buildMergeFilesLambda } from './functions/merge_files';
import { buildPollyListenerLambda } from './functions/polly_listener';
import { buildPollyWaitLambda } from './functions/polly_wait';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import { buildPrePollyLambda } from './functions/pre_polly';

/**
 * Builds Text-to-Speech (TTS) resources.
 *
 * @param stack - The AWS CloudFormation stack.
 * @param tasksTable - The DynamoDB table for storing TTS tasks.
 * @param contentTable - The DynamoDB table for storing TTS content.
 * @returns An object containing the built TTS resources.
 */
const buildTtsResources = (
  stack: Stack,
  tasksTable: Table,
  contentTable: Table
) => {
  const prePollyLambda = buildPrePollyLambda(stack);
  const pollyListenerLambda = buildPollyListenerLambda(stack, tasksTable);
  const pollyWaitLambda = buildPollyWaitLambda(stack, tasksTable);
  const bucket = buildBucket(stack, pollyListenerLambda);
  const mergeFilesLambda = buildMergeFilesLambda(
    stack,
    contentTable,
    tasksTable,
    bucket
  );

  return {
    prePollyLambda,
    pollyListenerLambda,
    pollyWaitLambda,
    bucket,
    mergeFilesLambda,
  };
};

export { buildTtsResources };
