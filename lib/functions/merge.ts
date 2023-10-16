import { Duration, Stack } from 'aws-cdk-lib';
import { ManagedPolicy, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { merge } from 'cheerio/lib/static';

const buildMergeLambda = (stack: Stack, bucket: Bucket) => {
  const mediaConvert = new Role(stack, 'ArticlesToSpeechMergeLambdaRole', {
    assumedBy: new ServicePrincipal('mediaconvert.amazonaws.com'),
  });

  mediaConvert.addToPolicy(
    new PolicyStatement({
      actions: ['mediaconvert:CreateJob'],
      resources: ['*'],
    })
  );
  bucket.grantReadWrite(mediaConvert);


  const mergeLambda = new NodejsFunction(stack, `ArticlesToSpeechMergeLambda`, {
    functionName: `ArticlesToSpeechMerge`,
    entry: './src/functions/merge.ts',
    handler: 'main',
    runtime: Runtime.NODEJS_LATEST,
    timeout: Duration.minutes(1),
    environment: {
      BUCKET_NAME: bucket.bucketName,
      MEDIA_CONVERT_ROLE_ARN: mediaConvert.roleArn
    },
  });

  mergeLambda.role!.addToPrincipalPolicy(
    new PolicyStatement({
      actions: ['iam:PassRole', 'mediaconvert:CreateJob'],
      resources: ['*'],
    })
  );

  bucket.grantReadWrite(mergeLambda);

  return mergeLambda;
};

export { buildMergeLambda };