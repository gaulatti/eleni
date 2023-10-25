import { Duration, Stack } from 'aws-cdk-lib';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { STACK_NAME } from '../../../consts';

const buildPreTranslateLambda = (stack: Stack) => {
  const deliverLambda = new NodejsFunction(
    stack,
    `${STACK_NAME}ArticlesToSpeechPreTranslateLambda`,
    {
      functionName: `${STACK_NAME}ArticlesToSpeechPreTranslate`,
      entry: './src/functions/translate/pre_translate.ts',
      handler: 'main',
      runtime: Runtime.NODEJS_LATEST,
      timeout: Duration.minutes(1),
    }
  );

  return deliverLambda;
};

export { buildPreTranslateLambda };