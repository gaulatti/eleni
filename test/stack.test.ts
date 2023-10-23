import { DebraStack } from '../lib/DebraStack';
import { Template } from 'aws-cdk-lib/assertions';
import { App } from 'aws-cdk-lib';

describe('buildDeliverLambda', () => {
  const stack = new DebraStack(new App(), 'TestStack');
  const assertTemplate = Template.fromStack(stack);

  it('should create an S3 bucket', () => {
    assertTemplate.resourceCountIs('AWS::S3::Bucket', 1);
  });

  it('should create DynamoDB tables', () => {
    assertTemplate.resourceCountIs('AWS::DynamoDB::Table', 2);
  });

  it('should create Lambda functions', () => {
    assertTemplate.resourceCountIs('AWS::Lambda::Function', 7);
  });

  it('should create an API Gateway', () => {
    assertTemplate.resourceCountIs('AWS::ApiGateway::RestApi', 1);
  });

  it('should create ArticlesToSpeech API with the specified name', () => {
    assertTemplate.hasResourceProperties('AWS::ApiGateway::RestApi', {
      Name: 'ArticlesToSpeech API',
    });
  });
});
