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
import { buildPollyWaitLambda } from '../functions/polly_wait';
const buildPollyWorkflow = (
  stack: Stack,
  bucket: Bucket,
  mergeLambda: NodejsFunction,
  preTranslateLambda: NodejsFunction,
  prePollyLambda: NodejsFunction,
  mergeFilesLambda: NodejsFunction,
  pollyWaitLambda: NodejsFunction,
  pollyListenerLambda: NodejsFunction
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
        Default: `PrePolly`,
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
          'uuid.$': '$.Payload.uuid',
          'url.$': '$.Payload.url',
          'title.$': '$.Payload.title',
          'language.$': '$.Payload.language',
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
                  'TargetLanguageCode.$': '$.language.translate',
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
                  'uuid.$': '$.uuid',
                  'url.$': '$.url',
                  'language.$': '$.language',
                  'text.$': '$.text',
                  'title.$': '$.titleTranslationResult.TranslatedText',
                  'byline.$': '$.byline',
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
                  'TargetLanguageCode.$': '$.language.translate',
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
                  'uuid.$': '$.uuid',
                  'url.$': '$.url',
                  'language.$': '$.language',
                  'text.$': '$.text',
                  'title.$': '$.title',
                  'byline.$': '$.bylineTranslationResult.TranslatedText',
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
                  'TargetLanguageCode.$': '$.language.translate',
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
                  'uuid.$': '$.uuid',
                  'url.$': '$.url',
                  'language.$': '$.language',
                  'text.$': '$.textTranslationResult.TranslatedText',
                  'title.$': '$.title',
                  'byline.$': '$.byline',
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
          'uuid.$': '$[0].uuid',
          'language.$': '$[0].language',
          'url.$': '$[0].url',
          'title.$': '$[0].title',
          'byline.$': '$[1].byline',
          'text.$': '$[2].text',
        },
        Next: 'PrePolly',
      },
      PrePolly: {
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
        Next: 'MergeSynthesis',
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
                  'LanguageCode.$': '$$.Execution.Input.language.code',
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
                Next: 'WaitForTitle',
              },
              WaitForTitle: {
                Type: 'Task',
                Resource: 'arn:aws:states:::lambda:invoke.waitForTaskToken',
                Parameters: {
                  FunctionName: pollyWaitLambda.functionArn,
                  Payload: {
                    'title.$': '$.title',
                    textType: 'title',
                    'token.$': '$$.Task.Token',
                  },
                },
                End: true,
                ResultSelector: {
                  'title.$': '$.url',
                },
                ResultPath: '$',
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
                      Next: 'WaitForParagraph',
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
                    WaitForParagraph: {
                      Type: 'Task',
                      Resource:
                        'arn:aws:states:::lambda:invoke.waitForTaskToken',
                      Parameters: {
                        FunctionName: pollyWaitLambda.functionArn,
                        Payload: {
                          'audioOutput.$': '$.audioOutput',
                          textType: 'paragraph',
                          'token.$': '$$.Task.Token',
                        },
                      },
                      End: true,
                      ResultSelector: {
                        'url.$': '$.url',
                      },
                      ResultPath: '$',
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
      MergeSynthesis: {
        Type: 'Pass',
        Next: 'MergeAudioFilesLambda',
        Parameters: {
          'uuid.$': '$$.Execution.Input.uuid',
          'title.$': '$[0].title',
          'text.$': '$[1].text',
        },
      },
      MergeAudioFilesLambda: {
        Type: 'Task',
        End: true,
        Resource: 'arn:aws:states:::lambda:invoke.waitForTaskToken',
        Parameters: {
          Payload: {
            'uuid.$': '$$.Execution.Input.uuid',
            'title.$': '$.title',
            'text.$': '$.text',
            'language.$': '$$.Execution.Input.language.code',
            'token.$': '$$.Task.Token',
          },
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
  pollyWaitLambda.grantInvoke(stateMachine);
  bucket.grantReadWrite(stateMachine);

  stateMachine.grantTaskResponse(pollyListenerLambda);
  // stateMachine.grantTaskResponse(mergeFilesLambda);

  return stateMachine;
};

export { buildPollyWorkflow };
