import { Stack } from 'aws-cdk-lib';
import { buildPreTranslateLambda } from './functions/pre_translate';

const buildTranslateModule = (stack: Stack) => {
  const preTranslateLambda = buildPreTranslateLambda(stack);

  return { preTranslateLambda };
};
export { buildTranslateModule };
