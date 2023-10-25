import { Stack } from 'aws-cdk-lib';
import { LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { STACK_NAME } from '../../consts';

const buildTtsContentApi = (stack: Stack, getLambda: NodejsFunction) => {
  const api = new RestApi(stack, `${STACK_NAME}ContentToSpeechApi`, {
    restApiName: `${STACK_NAME} ContentToSpeech API`,
  });

  const rootResource = api.root;
  const getResource = api.root.addResource('{contentId}');
  const getIntegration = new LambdaIntegration(getLambda);
  getResource.addMethod('GET', getIntegration, {
    requestParameters: {
      'method.request.path.contentId': true,
    },
  });

  const postIntegration = new LambdaIntegration(getLambda, {
    requestTemplates: {
      'application/json': JSON.stringify({
        contentId: "$input.params('contentId')",
        url: "$input.params('url')",
      }),
    },
  });

  rootResource.addMethod('POST', postIntegration, {
    requestParameters: {
      'method.request.path.contentId': true,
    },
    apiKeyRequired: false,
  });
};

export { buildTtsContentApi };
