import { Duration, Stack } from 'aws-cdk-lib';
import { Rule, Schedule } from 'aws-cdk-lib/aws-events';
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

const buildPollyLambda = (stack: Stack) => {
  const pollyLambda = new NodejsFunction(stack, `ArticlesToSpeechPollyLambda`, {
    functionName: `ArticlesToSpeechPolly`,
    entry: './src/functions/polly.ts',
    handler: 'main',
    runtime: Runtime.NODEJS_LATEST,
    timeout: Duration.minutes(1),
  });

  return pollyLambda;
};

export { buildPollyLambda };
