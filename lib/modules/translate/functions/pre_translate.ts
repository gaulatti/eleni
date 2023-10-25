import { Duration, Stack } from 'aws-cdk-lib';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

const buildPreTranslateLambda = (stack: Stack) => {
  const deliverLambda = new NodejsFunction(stack, `ArticlesToSpeechPreTranslateLambda`, {
    functionName: `ArticlesToSpeechPreTranslate`,
    entry: './src/functions/pre_translate.ts',
    handler: 'main',
    runtime: Runtime.NODEJS_LATEST,
    timeout: Duration.minutes(1),
  });

  return deliverLambda;
};

export { buildPreTranslateLambda };
