import { Stack } from 'aws-cdk-lib';
import {
  Effect,
  ManagedPolicy,
  PolicyStatement,
  Role,
  ServicePrincipal,
} from 'aws-cdk-lib/aws-iam';
import { STACK_NAME } from '../../consts';

const buildLambdaResolverRole = (stack: Stack) => {
  const lambdaRole = new Role(stack, `${STACK_NAME}LambdaServiceRole`, {
    assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
    managedPolicies: [
      ManagedPolicy.fromAwsManagedPolicyName(
        'service-role/AWSLambdaBasicExecutionRole'
      ),
    ],
  });

  lambdaRole.addManagedPolicy(
    ManagedPolicy.fromAwsManagedPolicyName(
      'service-role/AWSLambdaVPCAccessExecutionRole'
    )
  );

  lambdaRole.assumeRolePolicy?.addStatements(
    new PolicyStatement({
      actions: ['sts:AssumeRole'],
      effect: Effect.ALLOW,
      principals: [new ServicePrincipal('appsync.amazonaws.com')],
    })
  );
  return lambdaRole;
};

export { buildLambdaResolverRole };
