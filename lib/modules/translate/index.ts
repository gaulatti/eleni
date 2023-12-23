import { Stack } from 'aws-cdk-lib';
import { buildPreTranslateLambda } from './functions/pre_translate';

/**
 * Builds the translate module.
 *
 * @param stack - The stack object.
 * @returns An object containing the preTranslateLambda function.
 */
const buildTranslateModule = (stack: Stack) => {
  const preTranslateLambda = buildPreTranslateLambda(stack);

  return { preTranslateLambda };
};
export { buildTranslateModule };
