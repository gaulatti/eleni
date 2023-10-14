import { Stack } from 'aws-cdk-lib';
import { AttributeType, Table } from 'aws-cdk-lib/aws-dynamodb';

const buildArticlesTable = (stack: Stack) => {
  return new Table(stack, 'ArticlesToSpeechTable', {
    tableName: 'ArticlesToSpeechTable',
    partitionKey: { name: 'url', type: AttributeType.STRING },
  });
};

export { buildArticlesTable };
