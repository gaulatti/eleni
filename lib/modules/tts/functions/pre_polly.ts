import { Duration, Stack } from 'aws-cdk-lib';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

const buildPrePollyLambda = (stack: Stack) => {
  const deliverLambda = new NodejsFunction(stack, `ArticlesToSpeechPrePollyLambda`, {
    functionName: `ArticlesToSpeechPrePolly`,
    entry: './src/functions/pre_polly.ts',
    handler: 'main',
    runtime: Runtime.NODEJS_LATEST,
    timeout: Duration.minutes(1),
  });

  return deliverLambda;
};

export { buildPrePollyLambda };
