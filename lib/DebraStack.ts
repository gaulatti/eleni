import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { buildBucket } from './assets/bucket';
import { buildArticlesTable } from './database/articles';
import { buildDeliverLambda } from './functions/deliver';
import { buildMergeLambda } from './functions/merge';
import { buildMonitorLambda } from './functions/monitor';
import { buildTriggerLambda } from './functions/trigger';
import { buildPollyWorkflow } from './workflows/polly';
export class DebraStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const bucket = buildBucket(this);
    const articlesTable = buildArticlesTable(this);
    const monitorLambda = buildMonitorLambda(this, articlesTable);
    const mergeLambda = buildMergeLambda(this, bucket);
    const deliverLambda = buildDeliverLambda(this, articlesTable);

    const stateMachine = buildPollyWorkflow(this, bucket, mergeLambda);
    const triggerLambda = buildTriggerLambda(this, articlesTable, stateMachine);
  }
}
