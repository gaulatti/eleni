import { RemovalPolicy, Stack } from 'aws-cdk-lib';
import { BlockPublicAccess, Bucket } from 'aws-cdk-lib/aws-s3';

const buildBucket = (stack: Stack) => {
  const bucket = new Bucket(stack, 'ArticlesToSpeechBucket', {
    removalPolicy: RemovalPolicy.DESTROY,
    publicReadAccess: true
  });
  return bucket;
};

export { buildBucket };
