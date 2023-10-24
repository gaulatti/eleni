import { Stack, StackProps } from 'aws-cdk-lib';
import { LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';
import { buildBucket } from './assets/bucket';
import { buildArticlesTable } from './database/articles';
import { buildTasksTable } from './database/tasks';
import { buildGetLambda } from './functions/get';
import { buildMergeFilesLambda } from './functions/merge_files';
import { buildPrePollyLambda } from './functions/pre_polly';
import { buildPreTranslateLambda } from './functions/pre_translate';
import { buildTriggerLambda } from './functions/trigger';
import { buildPollyWorkflow } from './workflows/polly';
import { buildPollyListenerLambda } from './functions/polly_listener';
import { buildPollyWaitLambda } from './functions/polly_wait';
export class DebraStack extends Stack {
  constructor(scope: Construct, uuid: string, props?: StackProps) {
    super(scope, uuid, props);

    const articlesTable = buildArticlesTable(this);
    const tasksTable = buildTasksTable(this);
    const pollyListenerLambda = buildPollyListenerLambda(this, tasksTable);
    const pollyWaitLambda = buildPollyWaitLambda(this, tasksTable);
    const bucket = buildBucket(this, pollyListenerLambda);
    const getLambda = buildGetLambda(this, articlesTable, bucket);
    const preTranslateLambda = buildPreTranslateLambda(this);
    const prePollyLambda = buildPrePollyLambda(this);
    const mergeFilesLambda = buildMergeFilesLambda(
      this,
      articlesTable,
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
      pollyListenerLambda,
    );

    const triggerLambda = buildTriggerLambda(this, articlesTable, stateMachine);
  }
}
