import { Duration, Stack } from 'aws-cdk-lib';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import { Rule, Schedule } from 'aws-cdk-lib/aws-events';
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

const buildMonitorLambda = (stack: Stack, table: Table) => {
  const monitorLambda = new NodejsFunction(stack, `ArticlesToSpeechMonitor`, {
    functionName: `ArticlesToSpeechMonitor`,
    entry: './src/functions/monitor.ts',
    handler: 'main',
    runtime: Runtime.NODEJS_LATEST,
    timeout: Duration.minutes(1),
  });

  const rule = new Rule(stack, 'ArticlesToSpeechInvokeLambdaRule', {
    schedule: Schedule.rate(Duration.minutes(30)),
  });

  rule.addTarget(new LambdaFunction(monitorLambda));
  table.grantReadWriteData(monitorLambda);

  return monitorLambda;
};

export { buildMonitorLambda };
