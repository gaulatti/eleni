import { Duration, Stack } from 'aws-cdk-lib';
import { Rule, Schedule } from 'aws-cdk-lib/aws-events';
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

const buildTriggerLambda = (stack: Stack) => {
  const triggerLambda = new NodejsFunction(stack, `ArticlesToSpeechTrigger`, {
    functionName: `ArticlesToSpeechTrigger`,
    entry: './src/functions/trigger.ts',
    handler: 'main',
    runtime: Runtime.NODEJS_LATEST,
    timeout: Duration.minutes(1),
  });

  const rule = new Rule(stack, 'ArticlesToSpeechInvokeLambdaRule', {
    schedule: Schedule.rate(Duration.minutes(30)),
  });

  rule.addTarget(new LambdaFunction(triggerLambda));

  return triggerLambda;
};

export { buildTriggerLambda };
