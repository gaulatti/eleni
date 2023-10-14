import { Stack } from 'aws-cdk-lib';
import { ManagedPolicy, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { DefinitionBody, StateMachine } from 'aws-cdk-lib/aws-stepfunctions';

const buildPollyWorkflow = (
  stack: Stack,
  bucket: Bucket,
  mergeLambda: NodejsFunction
) => {
  const stateMachineRole = new Role(stack, 'StateMachineRole', {
    assumedBy: new ServicePrincipal('states.amazonaws.com'),
  });

  const pollyManagedPolicy = ManagedPolicy.fromAwsManagedPolicyName(
    'AmazonPollyFullAccess'
  );

  const stateTemplate = {
    StartAt: 'SynthTitle',
    States: {
      SynthTitle: {
        Type: 'Task',
        Next: 'SynthParagraphs',
        Parameters: {
          OutputS3BucketName: bucket.bucketName,
          'Text.$': '$.title',
          TextType: 'ssml',
          OutputFormat: 'mp3',
          OutputS3KeyPrefix: 'audio/',
          VoiceId: 'Joanna',
        },
        Resource: 'arn:aws:states:::aws-sdk:polly:startSpeechSynthesisTask',
        ResultPath: '$.titleOutput',
      },
      SynthParagraphs: {
        Type: 'Map',
        Next: 'Wait',
        InputPath: '$.paragraphGroups',
        MaxConcurrency: 5,
        Iterator: {
          StartAt: 'SynthParagraph',
          States: {
            SynthParagraph: {
              Type: 'Task',
              End: true,
              Parameters: {
                OutputS3BucketName: bucket.bucketName,
                'Text.$': '$',
                TextType: 'text',
                OutputFormat: 'mp3',
                OutputS3KeyPrefix: 'audio/',
                VoiceId: 'Joanna',
              },
              Resource:
                'arn:aws:states:::aws-sdk:polly:startSpeechSynthesisTask',
            },
          },
        },
        ResultPath: '$.paragraphsOutput',
      },
      Wait: {
        Type: 'Wait',
        Seconds: 5,
        Next: 'MergeAudioFiles',
      },
      MergeAudioFiles: {
        Type: 'Task',
        End: true,
        Resource: 'arn:aws:states:::lambda:invoke',
        OutputPath: '$.Payload',
        Parameters: {
          'Payload.$': '$',
          FunctionName: mergeLambda.functionArn,
        },
        Retry: [
          {
            ErrorEquals: [
              'Lambda.ServiceException',
              'Lambda.AWSLambdaException',
              'Lambda.SdkClientException',
              'Lambda.TooManyRequestsException',
            ],
            IntervalSeconds: 1,
            MaxAttempts: 3,
            BackoffRate: 2,
          },
        ],
      },
    },
  };

  const stateMachine = new StateMachine(stack, 'ArticlesToSpeechStateMachine', {
    definitionBody: DefinitionBody.fromString(JSON.stringify(stateTemplate)),
    role: stateMachineRole,
  });

  stateMachineRole.addManagedPolicy(pollyManagedPolicy);
  mergeLambda.grantInvoke(stateMachine);
  bucket.grantReadWrite(stateMachine);

  return stateMachine;
};

export { buildPollyWorkflow };
