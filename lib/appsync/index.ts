import { Stack } from 'aws-cdk-lib';
import {
  CfnResolver,
  Definition,
  FieldLogLevel,
  GraphqlApi,
} from 'aws-cdk-lib/aws-appsync';
import * as path from 'path';
import { STACK_NAME } from '../consts';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { buildLambdaResolverRole } from './roles/lambdaResolverRole';
import { createVpc } from './network/vpc';
import { createPipelineResolverBuilder } from './builders/pipelineResolverBuilder';

const buildAppsyncApi = (stack: Stack, getLambda: NodejsFunction) => {
  const api = new GraphqlApi(stack, `${STACK_NAME}Api`, {
    name: `${STACK_NAME}Api`,
    definition: Definition.fromFile(path.join(__dirname, 'eleni.graphql')),
    logConfig: {
      fieldLogLevel: FieldLogLevel.ALL,
    },
    xrayEnabled: true,
  });

  const lambdaRole = buildLambdaResolverRole(stack);
  const vpc = createVpc(stack);
  const pipelineResolverBuilder = createPipelineResolverBuilder(
    stack,
    lambdaRole,
    api,
    vpc
  );

  const { configuration: getAudioContentFunction } = pipelineResolverBuilder(
    'getContentAudio',
    getLambda
  );

  new CfnResolver(stack, `${STACK_NAME}GetAudioContentResolver`, {
    apiId: api.apiId,
    typeName: 'Query',
    fieldName: 'getContentAudio',
    kind: 'PIPELINE',
    pipelineConfig: {
      functions: [getAudioContentFunction.attrFunctionId],
    },
    requestMappingTemplate: `
        {
          "version": "2017-02-28",
          "operation" : "Invoke",
          "payload": {}
        }
        `,
    responseMappingTemplate: `$util.toJson($context.prev.result)`,
  });
  return api;
};

export { buildAppsyncApi };
