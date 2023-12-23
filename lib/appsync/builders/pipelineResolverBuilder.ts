import { Duration, Stack } from 'aws-cdk-lib';
import {
  CfnDataSource,
  CfnFunctionConfiguration,
  GraphqlApi,
} from 'aws-cdk-lib/aws-appsync';
import { Vpc } from 'aws-cdk-lib/aws-ec2';
import { ArnPrincipal, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { STACK_NAME } from '../../consts';
import { capitalizeFirstLetter } from '../utils/strings';
/**
 * Creates a pipeline resolver builder.
 *
 * @param stack - The stack object.
 * @param role - The role object.
 * @param api - The GraphQL API object.
 * @param vpc - The VPC object.
 * @returns A function that can be used to create pipeline resolvers.
 */
const createPipelineResolverBuilder = (
  stack: Stack,
  role: Role,
  api: GraphqlApi,
  vpc: Vpc
) => {
  return (name: String, lambdaFunction?: NodejsFunction, entry?: string) => {
    name = capitalizeFirstLetter(name);
    const environment: { [k: string]: string } = {};

    if (!lambdaFunction && entry) {
      lambdaFunction = new NodejsFunction(
        stack,
        `${STACK_NAME}${name}PipelineResolverFunction`,
        {
          handler: 'resolver',
          entry,
          environment,
          vpc,
          runtime: Runtime.NODEJS_18_X,
          timeout: Duration.seconds(60),
          allowPublicSubnet: true,
          role,
        }
      );
    }

    /**
     * If no lambdaFunction is provided, and no entry is provided,
     * then we can't create a lambda function.
     */
    if (!lambdaFunction) {
      throw new Error('No Lambda, No Entry, no Party.');
    }

    lambdaFunction.grantInvoke(new ServicePrincipal('appsync.amazonaws.com'));

    lambdaFunction.addPermission('AllowRoleToInvoke', {
      principal: new ArnPrincipal(role.roleArn),
    });

    const dataSource = new CfnDataSource(
      stack,
      `${STACK_NAME}${name}DataSource`,
      {
        apiId: api.apiId,
        name: `${STACK_NAME}${name}DataSource`,
        type: 'AWS_LAMBDA',
        lambdaConfig: {
          lambdaFunctionArn: lambdaFunction.functionArn,
        },
        serviceRoleArn: role.roleArn,
      }
    );

    const configuration = new CfnFunctionConfiguration(
      stack,
      `${STACK_NAME}${name}FunctionConfiguration`,
      {
        apiId: api.apiId,
        dataSourceName: dataSource.name,
        name: `${STACK_NAME}${name}PipelineFunction`,
        functionVersion: '2018-05-29',
        requestMappingTemplate: `
        {
          "version": "2017-02-28",
          "operation" : "Invoke",
          "payload": {
            "args": $util.toJson($context.args),
            "identity": $util.toJson($context.identity)
          }
        }
        `,
        responseMappingTemplate: `$util.toJson($context.result)`,
      }
    );

    configuration.addDependency(dataSource);
    return { lambdaFunction, configuration };
  };
};

export { createPipelineResolverBuilder };
