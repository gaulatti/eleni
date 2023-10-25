import { Stack, StackProps } from 'aws-cdk-lib';
import { LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';
import { buildDatabases } from './databases';
import { buildGetLambda } from './functions/get';
import { buildTriggerLambda } from './functions/trigger';
import { buildTranslateModule } from './modules/translate';
import { buildBucket } from './modules/tts/assets/bucket';
import { buildMergeFilesLambda } from './modules/tts/functions/merge_files';
import { buildPollyListenerLambda } from './modules/tts/functions/polly_listener';
import { buildPollyWaitLambda } from './modules/tts/functions/polly_wait';
import { buildPrePollyLambda } from './modules/tts/functions/pre_polly';
import { buildPollyWorkflow } from './workflows/polly';
export class EleniStack extends Stack {
  constructor(scope: Construct, uuid: string, props?: StackProps) {
    super(scope, uuid, props);

    const { contentTable, tasksTable } = buildDatabases(this);
    const { preTranslateLambda } = buildTranslateModule(this);

    const pollyListenerLambda = buildPollyListenerLambda(this, tasksTable);
    const pollyWaitLambda = buildPollyWaitLambda(this, tasksTable);
    const bucket = buildBucket(this, pollyListenerLambda);
    const getLambda = buildGetLambda(this, contentTable, bucket);
    const prePollyLambda = buildPrePollyLambda(this);
    const mergeFilesLambda = buildMergeFilesLambda(
      this,
      contentTable,
      tasksTable,
      bucket
    );

    const api = new RestApi(this, 'ArticlesToSpeechApi', {
      restApiName: 'ArticlesToSpeech API',
    });

    const rootResource = api.root;
    const getResource = api.root.addResource('{articleId}');
    const getIntegration = new LambdaIntegration(getLambda);
    getResource.addMethod('GET', getIntegration, {
      requestParameters: {
        'method.request.path.articleId': true,
      },
    });

    const postIntegration = new LambdaIntegration(getLambda, {
      requestTemplates: {
        'application/json': JSON.stringify({
          articleId: "$input.params('articleId')",
          url: "$input.params('url')",
        }),
      },
    });

    rootResource.addMethod('POST', postIntegration, {
      requestParameters: {
        'method.request.path.articleId': true,
      },
      apiKeyRequired: false,
    });

    const stateMachine = buildPollyWorkflow(
      this,
      bucket,
      preTranslateLambda,
      prePollyLambda,
      mergeFilesLambda,
      pollyWaitLambda,
      pollyListenerLambda
    );

    const triggerLambda = buildTriggerLambda(this, contentTable, stateMachine);
  }
}
