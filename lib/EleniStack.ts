import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { buildDatabases } from './databases';
import { buildTranslateModule } from './modules/translate';
import { buildTtsResources } from './modules/tts';
import { buildTtsContentWorkflow } from './workflows/ttsContent';
import { buildAppsyncApi } from './appsync';
/**
 * Represents the EleniStack class that extends the Stack class.
 * This class is responsible for building the Eleni stack and its resources.
 */
export class EleniStack extends Stack {
  constructor(scope: Construct, uuid: string, props?: StackProps) {
    super(scope, uuid, props);

    const { contentTable, tasksTable } = buildDatabases(this);
    const { preTranslateLambda } = buildTranslateModule(this);

    const {
      prePollyLambda,
      pollyListenerLambda,
      pollyWaitLambda,
      bucket,
      mergeFilesLambda,
    } = buildTtsResources(this, tasksTable, contentTable);


    const { getLambda } = buildTtsContentWorkflow(
      this,
      bucket,
      contentTable,
      preTranslateLambda,
      prePollyLambda,
      mergeFilesLambda,
      pollyWaitLambda,
      pollyListenerLambda
    );

    const api = buildAppsyncApi(this, getLambda)
  }
}
