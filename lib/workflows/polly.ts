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
const buildPollyWorkflow = (
  stack: Stack,
  bucket: Bucket,
  mergeLambda: NodejsFunction,
  preTranslateLambda: NodejsFunction,
  prePollyLambda: NodejsFunction,
  mergeFilesLambda: NodejsFunction
) => {
  const stateMachineRole = new Role(stack, 'StateMachineRole', {
    assumedBy: new ServicePrincipal('states.amazonaws.com'),
  });

  const languagesStateTemplate = {
    StartAt: `AvoidTranslateEN`,
    States: {
      AvoidTranslateEN: {
        Type: 'Choice',
        Choices: [
          {
            Not: {
              Variable: '$.language.translate',
              StringEquals: 'en',
            },
            Next: `PreTranslate`,
          },
        ],
        Default: `PrePollyNotTranslated`,
      },
      PreTranslate: {
        Type: 'Task',
        Resource: 'arn:aws:states:::lambda:invoke',
        Parameters: {
          FunctionName: preTranslateLambda.functionArn,
          'Payload.$': '$',
        },
        Next: `ParallelTranslation`,
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
      ParallelTranslation: {
        Type: 'Parallel',
        Next: 'MergeTranslations',
        Branches: [
          {
            StartAt: 'TranslateTitle',
            States: {
              TranslateTitle: {
                Type: 'Task',
                Parameters: {
                  SourceLanguageCode: 'en-US',
                  'TargetLanguageCode.$': '$.translate',
                  'Text.$': '$.title',
                },
                Resource: 'arn:aws:states:::aws-sdk:translate:translateText',
                ResultPath: '$.titleTranslationResult',
                Next: 'ReshapeTitleTranslation',
              },
              ReshapeTitleTranslation: {
                Type: 'Pass',
                ResultPath: '$',
                Parameters: {
                  'selectedVoice.$': '$.selectedVoice',
                  'language.$': '$.language',
                  'text.$': '$.text',
                  'title.$': '$.titleTranslationResult.TranslatedText',
                  'byline.$': '$.byline',
                  'translate.$': '$.translate',
                },
                End: true,
              },
            },
          },
          {
            StartAt: 'TranslateByline',
            States: {
              TranslateByline: {
                Type: 'Task',
                Parameters: {
                  SourceLanguageCode: 'en-US',
                  'TargetLanguageCode.$': '$.translate',
                  'Text.$': '$.byline',
                },
                Resource: 'arn:aws:states:::aws-sdk:translate:translateText',
                ResultPath: '$.bylineTranslationResult',
                Next: 'ReshapeBylineTranslation',
              },
              ReshapeBylineTranslation: {
                Type: 'Pass',
                ResultPath: '$',
                Parameters: {
                  'selectedVoice.$': '$.selectedVoice',
                  'language.$': '$.language',
                  'text.$': '$.text',
                  'title.$': '$.title',
                  'byline.$': '$.bylineTranslationResult.TranslatedText',
                  'translate.$': '$.translate',
                },
                End: true,
              },
            },
          },
          {
            StartAt: 'TranslateContent',
            States: {
              TranslateContent: {
                Type: 'Task',
                Parameters: {
                  SourceLanguageCode: 'en-US',
                  'TargetLanguageCode.$': '$.translate',
                  'Text.$': '$.text',
                },
                Resource: 'arn:aws:states:::aws-sdk:translate:translateText',
                ResultPath: '$.textTranslationResult',
                Next: 'ReshapeContentTranslation',
              },
              ReshapeContentTranslation: {
                Type: 'Pass',
                ResultPath: '$',
                Parameters: {
                  'selectedVoice.$': '$.selectedVoice',
                  'language.$': '$.language',
                  'text.$': '$.textTranslationResult.TranslatedText',
                  'title.$': '$.title',
                  'byline.$': '$.byline',
                  'translate.$': '$.translate',
                },
                End: true,
              },
            },
          },
        ],
      },
      MergeTranslations: {
        Type: 'Pass',
        Parameters: {
          'selectedVoice.$': '$[0].selectedVoice',
          'language.$': '$[0].language',
          'title.$': '$[0].title',
          'byline.$': '$[1].byline',
          'text.$': '$[2].text',
          'translate.$': '$[0].translate',
        },
        Next: 'PrePollyTranslated',
      },
      PrePollyNotTranslated: {
        Type: 'Task',
        Resource: 'arn:aws:states:::lambda:invoke',
        Parameters: {
          FunctionName: prePollyLambda.functionArn,
          'Payload.$': '$',
        },
        Next: `ParallelAudioGeneration`,
        ResultSelector: {
          'uuid.$': '$$.Execution.Input.uuid',
          'title.$': '$.Payload.title',
          'language.$': '$.Payload.language',
          'textInput.$': '$.Payload.textInput',
          'selectedVoice.$': '$.Payload.selectedVoice',
        },
        ResultPath: '$',
      },
      PrePollyTranslated: {
        Type: 'Task',
        Resource: 'arn:aws:states:::lambda:invoke',
        Parameters: {
          FunctionName: prePollyLambda.functionArn,
          'Payload.$': '$',
        },
        Next: `ParallelAudioGeneration`,
        ResultSelector: {
          'uuid.$': '$$.Execution.Input.uuid',
          'title.$': '$.Payload.title',
          'language.$': '$.Payload.language',
          'text.$': '$.Payload.text',
          'selectedVoice.$': '$.Payload.selectedVoice',
        },
        ResultPath: '$',
      },
      ParallelAudioGeneration: {
        Type: 'Parallel',
        Next: 'MergeAudioFilesLambda',
        Branches: [
          {
            StartAt: 'SynthTitle',
            States: {
              SynthTitle: {
                Type: 'Task',
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
                Resource:
                  'arn:aws:states:::aws-sdk:polly:startSpeechSynthesisTask',
                ResultPath: '$.title',
                End: true,
              },
            },
          },
          {
            StartAt: 'SynthParagraphs',
            States: {
              SynthParagraphs: {
                Type: 'Map',
                InputPath: '$.text',
                MaxConcurrency: 5,
                Iterator: {
                  StartAt: 'SynthParagraphAudio',
                  States: {
                    SynthParagraphAudio: {
                      Type: 'Task',
                      End: true,
                      Parameters: {
                        OutputS3BucketName: bucket.bucketName,
                        'Text.$': '$.text',
                        TextType: 'ssml',
                        Engine: 'neural',
                        'LanguageCode.$': '$$.Execution.Input.language.code',
                        'VoiceId.$': '$.voice',
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
                  },
                },
                ResultPath: '$.text',
                End: true,
              },
            },
          },
        ],
      },
      MergeAudioFilesLambda: {
        Type: 'Task',
        End: true,
        Resource: 'arn:aws:states:::lambda:invoke',
        Parameters: {
          'Payload.$': '$',
          FunctionName: mergeFilesLambda.functionArn,
        },
        Retry: [
          {
            ErrorEquals: ['States.ALL'],
            IntervalSeconds: 1,
            MaxAttempts: 20,
          },
        ],
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
  mergeFilesLambda.grantInvoke(stateMachine);
  bucket.grantReadWrite(stateMachine);

  return stateMachine;
};

export { buildPollyWorkflow };
