import { RemovalPolicy, Stack } from 'aws-cdk-lib';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Bucket, EventType } from 'aws-cdk-lib/aws-s3';
import { LambdaDestination } from 'aws-cdk-lib/aws-s3-notifications';
import { STACK_NAME } from '../../../consts';

const buildBucket = (stack: Stack, pollyListenerLambda: NodejsFunction) => {
  const bucket = new Bucket(stack, `${STACK_NAME}ArticlesToSpeechBucket`, {
    bucketName: `${STACK_NAME.toLowerCase}-articles-to-speech`,
    removalPolicy: RemovalPolicy.DESTROY,
  });

  // Add event notification to send Object Created events to the Lambda function
  const prefix = 'audio/'; // adjust this as necessary
  bucket.addEventNotification(
    EventType.OBJECT_CREATED,
    new LambdaDestination(pollyListenerLambda),
    { prefix }
  );

  return bucket;
};

export { buildBucket };
