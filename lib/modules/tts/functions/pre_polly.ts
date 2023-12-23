import { Duration, Stack } from 'aws-cdk-lib';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { STACK_NAME } from '../../../consts';

/**
 * Builds and returns the pre-polly lambda function.
 *
 * @param stack - The AWS CloudFormation stack.
 * @returns The pre-polly lambda function.
 */
const buildPrePollyLambda = (stack: Stack) => {
  const deliverLambda = new NodejsFunction(
    stack,
    `${STACK_NAME}TextToSpeechPrePollyLambda`,
    {
      functionName: `${STACK_NAME}TextToSpeechPrePolly`,
      entry: './src/functions/tts/pre_polly.ts',
      handler: 'main',
      runtime: Runtime.NODEJS_LATEST,
      timeout: Duration.minutes(1),
    }
  );

  return deliverLambda;
};

export { buildPrePollyLambda };
