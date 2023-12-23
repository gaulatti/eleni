import { EleniStack } from './EleniStack';
import { Stack } from 'aws-cdk-lib';

describe('EleniStack', () => {
  it('should create an instance of EleniStack', () => {
    const stack = new Stack();
    const eleniStack = new EleniStack(stack, 'EleniStack');
    expect(eleniStack).toBeInstanceOf(EleniStack);
  });
});