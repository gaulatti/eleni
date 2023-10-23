import { Stack } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { buildBucket } from '../../lib/assets/bucket';

describe('buildBucket', () => {
  let stack: Stack;

  beforeEach(() => {
    stack = new Stack();
  });

  it('should create an S3 bucket with specified attributes', () => {
    buildBucket(stack);

    const assert = Template.fromStack(stack);
    assert.resourceCountIs('AWS::S3::Bucket', 1);

    // Adjusted assertions:
    assert.hasResource('AWS::S3::Bucket', {
      Type: "AWS::S3::Bucket",
      DeletionPolicy: "Delete",
      UpdateReplacePolicy: "Delete"
    });
  });
});
