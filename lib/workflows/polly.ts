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
  prePollyLambda: NodejsFunction,
  mergeFilesLambda: NodejsFunction,
  createPollyLambda: NodejsFunction
) => {
  const stateMachineRole = new Role(stack, 'StateMachineRole', {
    assumedBy: new ServicePrincipal('states.amazonaws.com'),
  });

  const waveTemplate = (wave: number) => ({
    StartAt: `PreTranslate${wave}`,
    States: {
      [`PreTranslate${wave}`]: {
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
        Next: `AvoidTranslateEN${wave}`,
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
      [`AvoidTranslateEN${wave}`]: {
        Type: 'Choice',
        Choices: [
          {
            Not: {
              Variable: '$.translate',
              StringEquals: 'en',
            },
            Next: `TranslateTitle${wave}`,
          },
        ],
        Default: `PrePollyNotTranslated${wave}`,
      },
      [`TranslateTitle${wave}`]: {
        Type: 'Task',
        Next: `TranslateByline${wave}`,
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
      [`TranslateByline${wave}`]: {
        Type: 'Task',
        Next: `TranslateContent${wave}`,
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
      [`TranslateContent${wave}`]: {
        Type: 'Task',
        Next: `PrePollyTranslated${wave}`,
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
      [`PrePollyNotTranslated${wave}`]: {
        Type: 'Task',
        Resource: 'arn:aws:states:::lambda:invoke',
        Parameters: {
          FunctionName: prePollyLambda.functionArn,
          Payload: {
            'title.$': '$.title',
            'text.$': '$.text',
            'byline.$': '$.byline',
            'selectedVoice.$': '$.selectedVoice',
            'language.$': '$.language',
          },
        },
        Next: `SynthTitle${wave}`,
        ResultSelector: {
          'uuid.$': '$$.Execution.Input.uuid',
          'title.$': '$.Payload.title',
          'language.$': '$.Payload.language',
          'textInput.$': '$.Payload.textInput',
          'selectedVoice.$': '$.Payload.selectedVoice',
        },
        ResultPath: '$',
      },
      [`PrePollyTranslated${wave}`]: {
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
        Next: `SynthTitle${wave}`,
        ResultSelector: {
          'uuid.$': '$$.Execution.Input.uuid',
          'title.$': '$.Payload.title',
          'language.$': '$.Payload.language',
          'textInput.$': '$.Payload.textInput',
          'selectedVoice.$': '$.Payload.selectedVoice',
        },
        ResultPath: '$',
      },
      [`SynthTitle${wave}`]: {
        Type: 'Task',
        Next: `SynthParagraphs${wave}`,
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
      [`SynthParagraphs${wave}`]: {
        Type: 'Map',
        Next: `MergeAudioFilesLambda${wave}`,
        InputPath: '$.textInput',
        MaxConcurrency: 5,
        Iterator: {
          StartAt: `SynthParagraphAudio${wave}`,
          States: {
            [`SynthParagraphAudio${wave}`]: {
              Type: 'Task',
              End: true,
              // Next: `WaitForPolly${wave}`,
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
            // [`WaitForPolly${wave}`]: {
            //   Type: 'Task',
            //   End: true,
            //   Resource: 'arn:aws:states:::lambda:invoke',
            //   Parameters: {
            //     'Payload.$': '$',
            //     FunctionName: createPollyLambda.functionArn,
            //   },
            //   Retry: [
            //     {
            //       ErrorEquals: [
            //         'Lambda.ServiceException',
            //         'Lambda.AWSLambdaException',
            //         'Lambda.SdkClientException',
            //         'Lambda.TooManyRequestsException',
            //       ],
            //       IntervalSeconds: 1,
            //       MaxAttempts: 3,
            //       BackoffRate: 2,
            //     },
            //   ],
            // }
            // [`SynthParagraphTranscription${wave}`]: {
            //   Type: 'Task',
            //   End: true,
            //   Parameters: {
            //     OutputS3BucketName: bucket.bucketName,
            //     'Text.$': '$.text',
            //     TextType: 'ssml',
            //     Engine: 'neural',
            //     OutputFormat: 'json',
            //     OutputS3KeyPrefix: 'transcription/',
            //     SpeechMarkTypes: ['sentence'],
            //     'LanguageCode.$': '$.language',
            //     'VoiceId.$': '$.selectedVoice.name',
            //   },
            //   ResultPath: '$.transcriptionOutput',
            //   Resource:
            //     'arn:aws:states:::aws-sdk:polly:startSpeechSynthesisTask',
            //   Retry: [
            //     {
            //       ErrorEquals: ['States.ALL'],
            //       BackoffRate: 2,
            //       IntervalSeconds: 2,
            //       MaxAttempts: 3,
            //       Comment: 'RetryPolly',
            //     },
            //   ],
            // },
          },
        },
        ResultPath: '$.paragraphsOutput',
      },
      [`MergeAudioFilesLambda${wave}`]: {
        Type: 'Task',
        End: true,
        Resource: 'arn:aws:states:::lambda:invoke',
        Parameters: {
          'Payload.$': '$',
          FunctionName: mergeFilesLambda.functionArn,
        },
        Retry: [
          {
            ErrorEquals: [
              'States.ALL',
            ],
            IntervalSeconds: 1,
            MaxAttempts: 20,
          },
        ],
      },
    },
  });

  const languagesStateTemplate = {
    StartAt: 'Reset-Wave1',
    States: {
      'Reset-Wave1': {
        Type: 'Pass',
        Next: 'Languages-Wave1',
        Result: { languages: languages.wave1 },
        ResultPath: '$',
        Parameters: {},
      },
      'Languages-Wave1': {
        Type: 'Map',
        ItemsPath: '$.languages',
        Iterator: waveTemplate(1),
        End: true,
      },
      // 'Reset-Wave2': {
      //   Type: 'Pass',
      //   Next: 'Languages-Wave2',
      //   Result: { languages: languages.wave2 },
      //   ResultPath: '$',
      //   Parameters: {},
      // },
      // 'Languages-Wave2': {
      //   Type: 'Map',
      //   ItemsPath: '$.languages',
      //   Iterator: waveTemplate(2),
      //   Next: 'Reset-Wave3',
      // },
      // 'Reset-Wave3': {
      //   Type: 'Pass',
      //   Next: 'Languages-Wave3',
      //   Result: { languages: languages.wave3 },
      //   ResultPath: '$',
      //   Parameters: {},
      // },
      // 'Languages-Wave3': {
      //   Type: 'Map',
      //   ItemsPath: '$.languages',
      //   Iterator: waveTemplate(3),
      //   Next: 'Reset-Wave4',
      // },
      // 'Reset-Wave4': {
      //   Type: 'Pass',
      //   Next: 'Languages-Wave4',
      //   Result: { languages: languages.wave4 },
      //   ResultPath: '$',
      //   Parameters: {},
      // },
      // 'Languages-Wave4': {
      //   Type: 'Map',
      //   ItemsPath: '$.languages',
      //   Iterator: waveTemplate(4),
      //   Next: 'Reset-Wave5',
      // },
      // 'Reset-Wave5': {
      //   Type: 'Pass',
      //   Next: 'Languages-Wave5',
      //   Result: { languages: languages.wave5 },
      //   ResultPath: '$',
      //   Parameters: {},
      // },
      // 'Languages-Wave5': {
      //   Type: 'Map',
      //   ItemsPath: '$.languages',
      //   Iterator: waveTemplate(5),
      //   Next: 'Reset-Wave6',
      // },
      // 'Reset-Wave6': {
      //   Type: 'Pass',
      //   Next: 'Languages-Wave6',
      //   Result: { languages: languages.wave6 },
      //   ResultPath: '$',
      //   Parameters: {},
      // },
      // 'Languages-Wave6': {
      //   Type: 'Map',
      //   ItemsPath: '$.languages',
      //   Iterator: waveTemplate(6),
      //   End: true,
      // },
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
  mergeFilesLambda.grantInvoke(stateMachine);
  createPollyLambda.grantInvoke(stateMachine);
  bucket.grantReadWrite(stateMachine);

  return stateMachine;
};

export { buildPollyWorkflow };
