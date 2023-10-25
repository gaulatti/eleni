import { Duration, Stack } from 'aws-cdk-lib';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import { Runtime, StartingPosition } from 'aws-cdk-lib/aws-lambda';
import { DynamoEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { StateMachine } from 'aws-cdk-lib/aws-stepfunctions';
import { STACK_NAME } from '../../../consts';

const buildTriggerLambda = (
  stack: Stack,
  table: Table,
  stateMachine: StateMachine
) => {
  const triggerLambda = new NodejsFunction(stack, `${STACK_NAME}ContentToSpeechTrigger`, {
    functionName: `${STACK_NAME}ContentToSpeechTrigger`,
    entry: './src/functions/workflows/content-to-speech/trigger.ts',
    handler: 'main',
    runtime: Runtime.NODEJS_LATEST,
    timeout: Duration.minutes(1),
    environment: {
      STATE_MACHINE_ARN: stateMachine.stateMachineArn,
    },
  });

  stateMachine.grantStartExecution(triggerLambda);
  table.grantReadWriteData(triggerLambda);
  triggerLambda.addEventSource(
    new DynamoEventSource(table, {
      batchSize: 1,
      startingPosition: StartingPosition.LATEST,
    })
  );

  return triggerLambda;
};

export { buildTriggerLambda };
