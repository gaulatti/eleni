import { Stack, StackProps } from 'aws-cdk-lib';
import { LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';
import { buildBucket } from './assets/bucket';
import { buildArticlesTable } from './database/articles';
import { buildDeliverLambda } from './functions/deliver';
import { buildGetLambda } from './functions/get';
import { buildListLambda } from './functions/list';
import { buildMergeLambda } from './functions/merge';
import { buildMonitorLambda } from './functions/monitor';
import { buildTriggerLambda } from './functions/trigger';
import { buildPollyWorkflow } from './workflows/polly';
import { buildPreTranslateLambda } from './functions/pre_translate';
import { buildPrePollyLambda } from './functions/pre_polly';
import { buildMergeFilesLambda } from './functions/merge_files';
import { buildTasksTable } from './database/tasks';
export class DebraStack extends Stack {
  constructor(scope: Construct, uuid: string, props?: StackProps) {
    super(scope, uuid, props);

    const bucket = buildBucket(this);
    const articlesTable = buildArticlesTable(this);
    const tasksTable = buildTasksTable(this);
    // const monitorLambda = buildMonitorLambda(this, articlesTable);
    const mergeLambda = buildMergeLambda(this, bucket, articlesTable);
    const deliverLambda = buildDeliverLambda(this, articlesTable);
    const listLambda = buildListLambda(this, articlesTable);
    const getLambda = buildGetLambda(this, articlesTable);
    const preTranslateLambda = buildPreTranslateLambda(this);
    const prePollyLambda = buildPrePollyLambda(this);
    const mergeFilesLambda = buildMergeFilesLambda(this, articlesTable, tasksTable, bucket);

    const api = new RestApi(this, 'ArticlesToSpeechApi', {
      restApiName: 'ArticlesToSpeech API',
    });

    const rootResource = api.root;
    const listIntegration = new LambdaIntegration(listLambda);
    rootResource.addMethod('GET', listIntegration);

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
      mergeLambda,
      preTranslateLambda,
      prePollyLambda,
      mergeFilesLambda,
    );

    const triggerLambda = buildTriggerLambda(this, articlesTable, stateMachine);
  }
}
