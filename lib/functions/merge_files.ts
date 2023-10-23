import { Duration, Stack } from 'aws-cdk-lib';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import { LayerVersion, Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Bucket } from 'aws-cdk-lib/aws-s3';
const buildMergeFilesLambda = (
  stack: Stack,
  articlesTable: Table,
  tasksTable: Table,
  bucket: Bucket,
) => {
  const ffmpegLayerArn = 'arn:aws:lambda:us-east-1:876173464768:layer:ffmpeg:1';
  const ffmpegLayer = LayerVersion.fromLayerVersionArn(stack, 'ffmpegLayer', ffmpegLayerArn);

  const getLambda = new NodejsFunction(stack, `ArticlesToSpeechMergeFilesLambda`, {
    functionName: `ArticlesToSpeechMergeFilesLambda`,
    entry: './src/functions/merge_files.ts',
    handler: 'main',
    layers: [ffmpegLayer],
    runtime: Runtime.NODEJS_LATEST,
    timeout: Duration.seconds(30),
    environment: {
      BUCKET_NAME: bucket.bucketName,
    },
  });

  articlesTable.grantReadWriteData(getLambda)
  tasksTable.grantReadWriteData(getLambda)
  bucket.grantReadWrite(getLambda)

  return getLambda;
};

export { buildMergeFilesLambda };
