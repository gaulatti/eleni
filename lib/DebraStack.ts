import { Duration, Stack, StackProps } from 'aws-cdk-lib';
import {
  DefinitionBody,
  Pass,
  StateMachine,
  Wait,
  WaitTime,
} from 'aws-cdk-lib/aws-stepfunctions';
import { LambdaInvoke } from 'aws-cdk-lib/aws-stepfunctions-tasks';
import { Construct } from 'constructs';
import { buildBucket } from './assets/bucket';
import { buildArticlesTable } from './database/articles';
import { buildPollyLambda } from './functions/polly';
import { buildTriggerLambda } from './functions/trigger';
import { buildMonitorLambda } from './functions/monitor';

export class DebraStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);


    // const queryTask = new LambdaInvoke(this, 'ArticlesToSpeechQueryTask', {
    //   lambdaFunction: triggerLambda,
    // });

    // const pollyTask = new LambdaInvoke(this, 'ArticlesToSpeechPollyTask', {
    //   lambdaFunction: pollyLambda,
    // });

    const startState = new Pass(this, 'ArticlesToSpeechStartState');
    const stateMachine = new StateMachine(
      this,
      'ArticlesToSpeechStateMachine',
      {
        definitionBody: DefinitionBody.fromChainable(
          new Wait(this, 'Hello', {
            time: WaitTime.duration(Duration.seconds(10)),
          })
        ),
      }
    );


    const articlesTable = buildArticlesTable(this);
    const triggerLambda = buildTriggerLambda(this, articlesTable, stateMachine);
    const monitorLambda = buildMonitorLambda(this, articlesTable);
    const pollyLambda = buildPollyLambda(this);

    const bucket = buildBucket(this);
  }
}
