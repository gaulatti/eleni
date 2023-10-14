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
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import { ManagedPolicy, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
export class DebraStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const bucket = buildBucket(this);
    const stateMachineRole = new Role(this, 'StateMachineRole', {
      assumedBy: new ServicePrincipal('states.amazonaws.com'),
    });
    const pollyManagedPolicy = ManagedPolicy.fromAwsManagedPolicyName(
      'AmazonPollyFullAccess'
    );
    stateMachineRole.addManagedPolicy(pollyManagedPolicy);

    const stateTemplate = {
      StartAt: 'StartSpeechSynthesisTask',
      States: {
        StartSpeechSynthesisTask: {
          Type: 'Task',
          End: true,
          Parameters: {
            OutputS3BucketName: bucket.bucketName,
            Text: '',
            OutputFormat: 'mp3',
            OutputS3KeyPrefix: 'audio/',
            VoiceId: 'Matthew',
          },
          Resource: 'arn:aws:states:::aws-sdk:polly:startSpeechSynthesisTask',
          ResultSelector: {
            "Text.$": "$.title"
          }
        },
      },
    };

    const stateMachine = new StateMachine(
      this,
      'ArticlesToSpeechStateMachine',
      {
        definitionBody: DefinitionBody.fromString(JSON.stringify(stateTemplate)),
        role: stateMachineRole,
      }
    );
    bucket.grantReadWrite(stateMachine);

    const articlesTable = buildArticlesTable(this);
    const triggerLambda = buildTriggerLambda(this, articlesTable, stateMachine);
    const monitorLambda = buildMonitorLambda(this, articlesTable);
    const pollyLambda = buildPollyLambda(this);

  }
}
