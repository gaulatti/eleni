import { Stack } from 'aws-cdk-lib';
import {
  Effect,
  ManagedPolicy,
  Policy,
  PolicyStatement,
  Role,
  ServicePrincipal,
} from 'aws-cdk-lib/aws-iam';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { DefinitionBody, StateMachine } from 'aws-cdk-lib/aws-stepfunctions';
import { languages } from '../languages';
const buildPollyWorkflow = (
  stack: Stack,
  bucket: Bucket,
  mergeLambda: NodejsFunction,
  preTranslateLambda: NodejsFunction,
  prePollyLambda: NodejsFunction
) => {
  const stateMachineRole = new Role(stack, 'StateMachineRole', {
    assumedBy: new ServicePrincipal('states.amazonaws.com'),
  });

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
          LanguageCode: 'en-US',
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
                LanguageCode: 'en-US',
                OutputFormat: 'json',
                OutputS3KeyPrefix: 'transcription/',
                SpeechMarkTypes: ['sentence'],
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

  const waveTemplate = {
    StartAt: 'AvoidTranslateEN',
    States: {
      AvoidTranslateEN: {
        Type: 'Choice',
        Choices: [
          {
            Not: {
              Variable: '$.translate',
              StringEquals: 'en',
            },
            Next: 'PreTranslate',
          },
        ],
        Default: 'PrePolly',
      },
      PreTranslate: {
        Type: 'Task',
        Resource: 'arn:aws:states:::lambda:invoke',
        Parameters: {
          FunctionName: preTranslateLambda.functionArn,
          Payload: {
            'title.$': '$$.Execution.Input.title',
            'text.$': '$$.Execution.Input.text',
            'byline.$': '$$.Execution.Input.byline',
            'language.$': '$',
          },
        },
        Next: 'TranslateTitle',
        ResultSelector: {
          'title.$': '$.Payload.title',
          'language.$': '$.Payload.language',
          'translate.$': '$.Payload.translate',
          'selectedVoice.$': '$.Payload.selectedVoice',
          'byline.$': '$.Payload.byline',
          'text.$': '$.Payload.text',
        },
        ResultPath: '$',
      },
      TranslateTitle: {
        Type: 'Task',
        Next: 'TranslateByline',
        Parameters: {
          SourceLanguageCode: 'en-US',
          'TargetLanguageCode.$': '$.translate',
          'Text.$': '$.title',
        },
        Resource: 'arn:aws:states:::aws-sdk:translate:translateText',
        ResultPath: '$.translation.title',
        ResultSelector: {
          'text.$': '$.TranslatedText',
        },
      },
      TranslateByline: {
        Type: 'Task',
        Next: 'TranslateContent',
        Parameters: {
          SourceLanguageCode: 'en-US',
          'TargetLanguageCode.$': '$.translate',
          'Text.$': '$.byline',
        },
        Resource: 'arn:aws:states:::aws-sdk:translate:translateText',
        ResultSelector: {
          'text.$': '$.TranslatedText',
        },
        ResultPath: '$.translation.byline',
      },
      TranslateContent: {
        Type: 'Task',
        Next: 'PrePolly',
        Parameters: {
          SourceLanguageCode: 'en-US',
          'TargetLanguageCode.$': '$.translate',
          'Text.$': '$.text',
        },
        Resource: 'arn:aws:states:::aws-sdk:translate:translateText',
        ResultPath: '$.translation.content',
        ResultSelector: {
          'text.$': '$.TranslatedText',
        },
      },
      PrePolly: {
        Type: 'Task',
        Resource: 'arn:aws:states:::lambda:invoke',
        Parameters: {
          FunctionName: prePollyLambda.functionArn,
          Payload: {
            'title.$': '$.translation.title.text',
            'text.$': '$.translation.content.text',
            'byline.$': '$.translation.byline.text',
            'selectedVoice.$': '$.selectedVoice',
            'language.$': '$.language',
          },
        },
        Next: 'SynthTitle',
        ResultSelector: {
          'uuid.$': '$$.Execution.Input.uuid',
          'title.$': '$.Payload.title',
          'language.$': '$.Payload.language',
          'textInput.$': '$.Payload.textInput',
          'selectedVoice.$': '$.Payload.selectedVoice',
        },
        ResultPath: '$',
      },
      SynthTitle: {
        Type: 'Task',
        Next: 'SynthParagraphs',
        Parameters: {
          OutputS3BucketName: bucket.bucketName,
          'Text.$': '$.title',
          Engine: 'neural',
          TextType: 'ssml',
          OutputFormat: 'mp3',
          'LanguageCode.$': '$.language',
          'VoiceId.$': '$.selectedVoice.name',
          OutputS3KeyPrefix: 'audio/',
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
                'LanguageCode.$': '$.language',
                'VoiceId.$': '$.selectedVoice.name',
                OutputFormat: 'mp3',
                OutputS3KeyPrefix: 'audio/',
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
                SpeechMarkTypes: ['sentence'],
                'LanguageCode.$': '$.language',
                'VoiceId.$': '$.selectedVoice.name',
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
      }
    },
  };

  const languagesStateTemplate = {
    StartAt: 'SetLanguages',
    States: {
      SetLanguages: {
        Type: 'Pass',
        Next: 'Languages-Wave1',
        Result: languages,
        ResultPath: '$.languages',
      },
      'Languages-Wave1': {
        Type: 'Map',
        ItemsPath: '$.languages.wave1',
        Iterator: waveTemplate,
        End: true,
      },
    },
  };

  const stateMachine = new StateMachine(stack, 'ArticlesToSpeechStateMachine', {
    definitionBody: DefinitionBody.fromString(
      JSON.stringify(languagesStateTemplate)
    ),
    role: stateMachineRole,
  });

  stateMachineRole.addManagedPolicy(
    ManagedPolicy.fromAwsManagedPolicyName('AmazonPollyFullAccess')
  );

  stateMachineRole.addToPrincipalPolicy(
    new PolicyStatement({
      actions: ['translate:TranslateText'],
      resources: ['*'],
    })
  );

  mergeLambda.grantInvoke(stateMachine);
  preTranslateLambda.grantInvoke(stateMachine);
  prePollyLambda.grantInvoke(stateMachine);
  bucket.grantReadWrite(stateMachine);

  return stateMachine;
};

export { buildPollyWorkflow };
