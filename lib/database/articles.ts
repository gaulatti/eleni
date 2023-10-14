import { Stack } from 'aws-cdk-lib';
import { AttributeType, StreamViewType, Table } from 'aws-cdk-lib/aws-dynamodb';

const buildArticlesTable = (stack: Stack) => {
  return new Table(stack, 'ArticlesToSpeechTable', {
    tableName: 'ArticlesToSpeechTable',
    partitionKey: { name: 'url', type: AttributeType.STRING },
    stream: StreamViewType.NEW_IMAGE,
  });
};

export { buildArticlesTable };
