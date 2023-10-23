import { App, Stack } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { buildPreTranslateLambda } from '../../lib/functions/pre_translate';

describe('CDK Stack Test', () => {
  let stack: Stack;

  beforeEach(() => {
    const app = new App();
    stack = new Stack(app, 'TestStack');
    buildPreTranslateLambda(stack);
  });

  it('should add a NodejsFunction with the correct properties', () => {
    const assertTemplate = Template.fromStack(stack);

    assertTemplate.resourceCountIs('AWS::Lambda::Function', 1);

    assertTemplate.hasResourceProperties('AWS::Lambda::Function', {
      Handler: 'index.main',
      Runtime: Runtime.NODEJS_LATEST.toString(),
      Timeout: 60,
    });
  });
});
