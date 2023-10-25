import { RemovalPolicy, Stack } from 'aws-cdk-lib';
import { Bucket, EventType, NotificationKeyFilter } from 'aws-cdk-lib/aws-s3';
import { LambdaDestination } from 'aws-cdk-lib/aws-s3-notifications';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

const buildBucket = (stack: Stack, pollyListenerLambda: NodejsFunction) => {
  const bucket = new Bucket(stack, 'ArticlesToSpeechBucket', {
    bucketName: 'articles-to-speech-eleni',
    removalPolicy: RemovalPolicy.DESTROY,
  });

  // Add event notification to send Object Created events to the Lambda function
  const prefix = 'audio/'; // adjust this as necessary
  bucket.addEventNotification(EventType.OBJECT_CREATED, new LambdaDestination(pollyListenerLambda), { prefix });

  return bucket;
};

export { buildBucket };
