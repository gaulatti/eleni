import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { buildDatabases } from './databases';
import { buildTranslateModule } from './modules/translate';
import { buildTtsResources } from './modules/tts';
import { buildTtsContentWorkflow } from './workflows/ttsContent';
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


    const stateMachine = buildTtsContentWorkflow(
      this,
      bucket,
      contentTable,
      preTranslateLambda,
      prePollyLambda,
      mergeFilesLambda,
      pollyWaitLambda,
      pollyListenerLambda
    );
  }
}
