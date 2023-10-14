import { Duration, Stack } from 'aws-cdk-lib';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import { Runtime, StartingPosition } from 'aws-cdk-lib/aws-lambda';
import { DynamoEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { StateMachine } from 'aws-cdk-lib/aws-stepfunctions';
const buildTriggerLambda = (
  stack: Stack,
  table: Table,
  stateMachine: StateMachine
) => {
  const triggerLambda = new NodejsFunction(stack, `ArticlesToSpeechTrigger`, {
    functionName: `ArticlesToSpeechTrigger`,
    entry: './src/functions/trigger.ts',
    handler: 'main',
    runtime: Runtime.NODEJS_LATEST,
    timeout: Duration.minutes(1),
    environment: {
      STATE_MACHINE_ARN: stateMachine.stateMachineArn,
    },
  });

  stateMachine.grantStartExecution(triggerLambda);

  triggerLambda.addEventSource(
    new DynamoEventSource(table, {
      batchSize: 1,
      startingPosition: StartingPosition.LATEST,
    })
  );

  return triggerLambda;
};

export { buildTriggerLambda };
