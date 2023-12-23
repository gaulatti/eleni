import { Duration, Stack } from 'aws-cdk-lib';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { STACK_NAME } from '../../../consts';

/**
 * Builds and returns a pre-translate lambda function.
 *
 * @param stack - The stack object.
 * @returns The pre-translate lambda function.
 */
const buildPreTranslateLambda = (stack: Stack) => {
  const deliverLambda = new NodejsFunction(
    stack,
    `${STACK_NAME}TextPreTranslateLambda`,
    {
      functionName: `${STACK_NAME}TextPreTranslate`,
      entry: './src/functions/translate/pre_translate.ts',
      handler: 'main',
      runtime: Runtime.NODEJS_LATEST,
      timeout: Duration.minutes(1),
    }
  );

  return deliverLambda;
};

export { buildPreTranslateLambda };
