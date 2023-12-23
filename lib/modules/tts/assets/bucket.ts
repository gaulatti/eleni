import { RemovalPolicy, Stack } from 'aws-cdk-lib';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Bucket, EventType } from 'aws-cdk-lib/aws-s3';
import { LambdaDestination } from 'aws-cdk-lib/aws-s3-notifications';
import { STACK_NAME } from '../../../consts';

/**
 * Builds a bucket for text-to-speech functionality.
 *
 * @param stack - The AWS CloudFormation stack.
 * @param pollyListenerLambda - The Lambda function for Polly listener.
 * @returns The created bucket.
 */
const buildBucket = (stack: Stack, pollyListenerLambda: NodejsFunction) => {
  const bucket = new Bucket(stack, `${STACK_NAME}TextToSpeechBucket`, {
    bucketName: `${STACK_NAME.toLowerCase()}-text-to-speech`,
    removalPolicy: RemovalPolicy.DESTROY,
  });

  const prefix = 'audio/';
  bucket.addEventNotification(
    EventType.OBJECT_CREATED,
    new LambdaDestination(pollyListenerLambda),
    { prefix }
  );

  return bucket;
};

export { buildBucket };
