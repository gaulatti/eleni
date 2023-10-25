import { Stack } from 'aws-cdk-lib';
import { InterfaceVpcEndpoint, InterfaceVpcEndpointAwsService, SubnetType, Vpc } from 'aws-cdk-lib/aws-ec2';
import { STACK_NAME } from '../../consts';
const createVpc = (stack: Stack) => {
  const vpc = new Vpc(stack, `${STACK_NAME}Vpc`, {
    cidr: '10.0.0.0/16',
    natGateways: 0,
    maxAzs: 2,
    subnetConfiguration: [
      {
        name: `private-${STACK_NAME.toLowerCase()}`,
        subnetType: SubnetType.PRIVATE_WITH_EGRESS,
        cidrMask: 24,
      },
      {
        name: `public-${STACK_NAME.toLowerCase}`,
        subnetType: SubnetType.PUBLIC,
        cidrMask: 24,
      },
    ],
  });

  new InterfaceVpcEndpoint(stack, `${STACK_NAME}ApoquindoVpcSecretsManagerEndpoint`, {
    service: InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
    vpc
  })

  return vpc;
};

export { createVpc };
