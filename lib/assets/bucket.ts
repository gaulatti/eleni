import { RemovalPolicy, Stack } from 'aws-cdk-lib';
import { Bucket } from 'aws-cdk-lib/aws-s3';

const buildBucket = (stack: Stack) => {
  const bucket = new Bucket(stack, 'ArticlesToSpeechBucket', {
    removalPolicy: RemovalPolicy.DESTROY,
  });
  return bucket;
};

export { buildBucket };
