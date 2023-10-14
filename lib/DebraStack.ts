import { Stack, StackProps } from 'aws-cdk-lib';
import { ManagedPolicy, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import {
  DefinitionBody,
  StateMachine
} from 'aws-cdk-lib/aws-stepfunctions';
import { Construct } from 'constructs';
import { buildBucket } from './assets/bucket';
import { buildArticlesTable } from './database/articles';
import { buildMonitorLambda } from './functions/monitor';
import { buildPollyLambda } from './functions/polly';
import { buildTriggerLambda } from './functions/trigger';
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
      StartAt: 'SynthTitle',
      States: {
        SynthTitle: {
          Type: 'Task',
          End: true,
          Parameters: {
            OutputS3BucketName: bucket.bucketName,
            "Text.$": "$.title",
            TextType: 'ssml',
            OutputFormat: 'mp3',
            OutputS3KeyPrefix: 'audio/',
            VoiceId: 'Joanna',
          },
          Resource: 'arn:aws:states:::aws-sdk:polly:startSpeechSynthesisTask',
          ResultPath: "$.titleOutput"
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
