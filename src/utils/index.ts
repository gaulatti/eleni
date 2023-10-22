import { getArticlesTableInstance } from './dal';
import { LanguageObject, pollyLanguages } from './consts/languages';

const articlesTableInstance = getArticlesTableInstance();
const excapeSSMLCharacters = (text: string) => {
  return text
    .replace(/"/g, '&quot;')
    .replace(/&/g, '&amp;')
    .replace(/'/g, '&apos;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
};

const delay = async (milliseconds = 1000) => {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
};

const sanitizeGetInputs = (event: any) => {
  const { httpMethod, pathParameters = {}, body = '{}' } = event;

  const articleId =
    httpMethod === 'POST'
      ? JSON.parse(body).articleId
      : pathParameters.articleId;

  const href = httpMethod === 'POST' ? JSON.parse(body).url : null;
  const language = httpMethod === 'POST' ? JSON.parse(body).language : null;

  return { articleId, href, language };
};

const extractPathWithTrailingSlash = (url: string) => {
  const regex = /^https?:\/\/([a-zA-Z0-9_-]+\.)?cnn\.com\/(.*)/;
  const match = regex.exec(url);
  if (match && match[2]) {
    return '/' + match[2];
  }
  return null;
};

const lambdaHttpOutput = (statusCode: number, output?: any) => {
  return {
    statusCode: statusCode,
    body: JSON.stringify(output),
  };
};

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
  extractPathWithTrailingSlash,
  excapeSSMLCharacters,
  delay,
  sanitizeGetInputs,
  lambdaHttpOutput,
};
