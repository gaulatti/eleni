import { LanguageObject, pollyLanguages } from './consts/languages';

/**
 * Escapes SSML characters in the given text.
 * @param text - The text to escape.
 * @returns The escaped text.
 */
const excapeSSMLCharacters = (text: string) => {
  return text
    .replace(/"/g, '&quot;')
    .replace(/&/g, '&amp;')
    .replace(/'/g, '&apos;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
};

/**
 * Delays the execution for the specified number of milliseconds.
 * @param milliseconds The number of milliseconds to delay the execution. Default is 1000 milliseconds.
 * @returns A promise that resolves after the specified delay.
 */
const delay = async (milliseconds = 1000) => {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
};

/**
 * Sanitizes the inputs of the event object and extracts the contentId, href, and language.
 * @param event - The event object containing the inputs.
 * @returns An object containing the sanitized contentId, href, and language.
 */
const sanitizeGetInputs = (event: any) => {
  const { httpMethod, pathParameters = {}, body = '{}' } = event;

  const contentId =
    httpMethod === 'POST'
      ? JSON.parse(body).contentId
      : pathParameters.contentId;

  const href = httpMethod === 'POST' ? JSON.parse(body).url : null;
  const language = httpMethod === 'POST' ? JSON.parse(body).language : null;

  return { contentId, href, language };
};

/**
 * Extracts the path from a URL and adds a trailing slash.
 * @param url - The URL to extract the path from.
 * @returns The extracted path with a trailing slash, or null if the URL does not match the expected format.
 */
const extractPathWithTrailingSlash = (url: string) => {
  const regex = /^https?:\/\/([a-zA-Z0-9_-]+\.)?cnn\.com\/(.*)/;
  const match = regex.exec(url);
  if (match && match[2]) {
    return '/' + match[2];
  }
  return null;
};

/**
 * Creates an HTTP output object for AWS Lambda functions.
 * @param statusCode - The HTTP status code.
 * @param output - The output data to be serialized as the response body.
 * @returns The HTTP output object.
 */
const lambdaHttpOutput = (statusCode: number, output?: any) => {
  return {
    statusCode: statusCode,
    body: JSON.stringify(output),
  };
};

/**
 * Checks if the specified language is present in the item's outputs.
 * If a language is provided, it checks if the item has an output for that language.
 * If no language is provided, it checks if the item has outputs for all supported languages.
 * @param item - The item to check.
 * @param language - The language to check for. If null, checks for all supported languages.
 * @returns True if the language is present in the item's outputs, false otherwise.
 */
const checkLanguagesPresent = (item: any, language: string | null): boolean => {
  const languageCodes = pollyLanguages.map((item: LanguageObject) => item.code);

  if (language) {
    return item.outputs && item.outputs[language];
  } else {
    const outputKeys = Object.keys(item.outputs || {});
    return languageCodes.every((code: string) => outputKeys.includes(code));
  }
};

export {
  checkLanguagesPresent,
  delay,
  excapeSSMLCharacters,
  extractPathWithTrailingSlash,
  lambdaHttpOutput,
  sanitizeGetInputs,
};
