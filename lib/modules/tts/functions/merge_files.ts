import { Duration, Stack } from 'aws-cdk-lib';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { LayerVersion, Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { STACK_NAME } from '../../../consts';

const buildMergeFilesLambda = (
  stack: Stack,
  contentTable: Table,
  tasksTable: Table,
  bucket: Bucket
) => {
  const ffmpegLayerArn = `arn:aws:lambda:us-east-1:${stack.account}:layer:ffmpeg:1`;
  const ffmpegLayer = LayerVersion.fromLayerVersionArn(
    stack,
    'ffmpegLayer',
    ffmpegLayerArn
  );

  const getLambda = new NodejsFunction(
    stack,
    `${STACK_NAME}TextToSpeechMergeFilesLambda`,
    {
      functionName: `${STACK_NAME}TextToSpeechMergeFilesLambda`,
      entry: './src/functions/tts/merge_files.ts',
      handler: 'main',
      layers: [ffmpegLayer],
      runtime: Runtime.NODEJS_LATEST,
      timeout: Duration.seconds(15),
      memorySize: 512,
      environment: {
        BUCKET_NAME: bucket.bucketName,
        TABLE_NAME: contentTable.tableName,
      },
    }
  );

  const sendTaskSuccessPolicy = new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ['states:SendTaskSuccess', 'states:SendTaskFailure'],
    resources: ['*'],
  });

  getLambda.role?.addToPrincipalPolicy(sendTaskSuccessPolicy);
  contentTable.grantReadWriteData(getLambda);
  tasksTable.grantReadWriteData(getLambda);
  bucket.grantReadWrite(getLambda);

  return getLambda;
};

export { buildMergeFilesLambda };
