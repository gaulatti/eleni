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

export class DebraStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const articlesTable = buildArticlesTable(this)
    const triggerLambda = buildTriggerLambda(this);
    const pollyLambda = buildPollyLambda(this);
    articlesTable.grantReadWriteData(triggerLambda);

    const bucket = buildBucket(this)

    const queryTask = new LambdaInvoke(this, 'ArticlesToSpeechQueryTask', {
      lambdaFunction: triggerLambda,
    });

    const pollyTask = new LambdaInvoke(this, 'ArticlesToSpeechPollyTask', {
      lambdaFunction: pollyLambda,
    });

    const startState = new Pass(this, 'ArticlesToSpeechStartState');
    const simpleStateMachine = new StateMachine(
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
  }
}
