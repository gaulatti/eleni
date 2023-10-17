import { Stack } from 'aws-cdk-lib';
import { ManagedPolicy, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import {
  DefinitionBody,
  JsonPath,
  StateMachine,
} from 'aws-cdk-lib/aws-stepfunctions';

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
          Engine: 'neural',
          TextType: 'ssml',
          OutputFormat: 'mp3',
          OutputS3KeyPrefix: 'audio/',
          VoiceId: 'Joanna',
        },
        Retry: [
          {
            ErrorEquals: ['States.ALL'],
            BackoffRate: 2,
            IntervalSeconds: 2,
            MaxAttempts: 6,
            Comment: 'RetryPolly',
          },
        ],
        Resource: 'arn:aws:states:::aws-sdk:polly:startSpeechSynthesisTask',
        ResultPath: '$.titleOutput',
      },
      SynthParagraphs: {
        Type: 'Map',
        Next: 'BakeS3',
        InputPath: '$.textInput',
        MaxConcurrency: 5,
        Iterator: {
          StartAt: 'SynthParagraphAudio',
          States: {
            SynthParagraphAudio: {
              Type: 'Task',
              Next: 'SynthParagraphTranscription',
              Parameters: {
                OutputS3BucketName: bucket.bucketName,
                'Text.$': '$.text',
                TextType: 'ssml',
                Engine: 'neural',
                LanguageCode: 'en-US',
                OutputFormat: 'mp3',
                OutputS3KeyPrefix: 'audio/',
                VoiceId: 'Joanna',
              },
              ResultPath: '$.audioOutput',
              Resource:
                'arn:aws:states:::aws-sdk:polly:startSpeechSynthesisTask',
              Retry: [
                {
                  ErrorEquals: ['States.ALL'],
                  BackoffRate: 2,
                  IntervalSeconds: 2,
                  MaxAttempts: 3,
                  Comment: 'RetryPolly',
                },
              ],
            },
            SynthParagraphTranscription: {
              Type: 'Task',
              End: true,
              Parameters: {
                OutputS3BucketName: bucket.bucketName,
                'Text.$': '$.text',
                TextType: 'ssml',
                Engine: 'neural',
                OutputFormat: 'json',
                OutputS3KeyPrefix: 'transcription/',
                SpeechMarkTypes: ["sentence", "ssml", "viseme","word"],
                VoiceId: 'Joanna',
              },
              ResultPath: '$.transcriptionOutput',
              Resource:
                'arn:aws:states:::aws-sdk:polly:startSpeechSynthesisTask',
              Retry: [
                {
                  ErrorEquals: ['States.ALL'],
                  BackoffRate: 2,
                  IntervalSeconds: 2,
                  MaxAttempts: 3,
                  Comment: 'RetryPolly',
                },
              ],
            },
          },
        },
        ResultPath: '$.paragraphsOutput',
      },
      BakeS3: {
        Type: 'Wait',
        Seconds: 15,
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
