import {
  checkLanguagesPresent,
  delay,
  excapeSSMLCharacters,
  extractPathWithTrailingSlash,
  lambdaHttpOutput,
  sanitizeGetInputs,
} from '../../src/utils';

import { pollyLanguages } from '../../src/utils/consts/languages';

describe('Utility Functions', () => {
  it('should escape SSML characters correctly', () => {
    const input = `"<&>'`;
    const escaped = excapeSSMLCharacters(input);
    expect(escaped).toBe('&amp;quot;&lt;&amp;&gt;&apos;');
  });

  it('should delay execution', async () => {
    const start = Date.now();
    await delay(500);
    const end = Date.now();
    expect(end - start).toBeGreaterThanOrEqual(500);
  });

  it('should delay execution with default value', async () => {
    const start = Date.now();
    await delay();
    const end = Date.now();
    expect(end - start).toBeGreaterThanOrEqual(1000);
  });

  it('should sanitize POST inputs correctly', () => {
    const mockEvent = {
      httpMethod: 'POST',
      body: JSON.stringify({
        articleId: '123',
        url: 'http://example.com',
        language: 'en',
      }),
      pathParameters: {},
    };
    const result = sanitizeGetInputs(mockEvent);
    expect(result).toEqual({
      articleId: '123',
      href: 'http://example.com',
      language: 'en',
    });
  });

  it('should handle missing pathParameters', () => {
    const mockEvent = {
      httpMethod: 'GET',
      body: '{}',
    };
    const result = sanitizeGetInputs(mockEvent);
    expect(result).toEqual({
      articleId: undefined,
      href: null,
      language: null,
    });
  });

  it('should handle missing body', () => {
    const mockEvent = {
      httpMethod: 'POST',
      pathParameters: {},
    };
    const result = sanitizeGetInputs(mockEvent);
    expect(result).toEqual({
      articleId: undefined,
    });
  });

  it('should handle missing pathParameters and body', () => {
    const mockEvent = {
      httpMethod: 'POST',
    };
    const result = sanitizeGetInputs(mockEvent);
    expect(result).toEqual({
      articleId: undefined,
    });
  });

  it('should sanitize GET inputs correctly', () => {
    const mockEvent = {
      httpMethod: 'GET',
      pathParameters: {
        articleId: '789',
      },
      body: JSON.stringify({
        articleId: '001',
        url: 'http://anotherexample.com',
        language: 'fr',
      }),
    };
    const result = sanitizeGetInputs(mockEvent);
    expect(result).toEqual({
      articleId: '789',
      href: null,
      language: null,
    });
  });

  it('should extract path with trailing slash', () => {
    const url = 'https://sub.cnn.com/path/to/article';
    expect(extractPathWithTrailingSlash(url)).toBe('/path/to/article');
  });

  it('should return null for non-cnn.com domain', () => {
    const url = 'https://example.com/path/to/article';
    expect(extractPathWithTrailingSlash(url)).toBe(null);
  });

  it('should return null for cnn.com root domain without path', () => {
    const url = 'https://cnn.com';
    expect(extractPathWithTrailingSlash(url)).toBe(null);
  });

  it('should return null for an invalid URL', () => {
    const url = 'htps:/cnn.com/path/to/article';
    expect(extractPathWithTrailingSlash(url)).toBe(null);
  });

  it('should return formatted lambda HTTP output', () => {
    const output = lambdaHttpOutput(200, { success: true });
    expect(output).toEqual({
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    });
  });

  it('should check if languages are present in item', () => {
    const item = {
      outputs: {
        'en-US': 'output1',
        'es-US': 'output2',
      },
    };
    const allLanguages = pollyLanguages.map((lang) => lang.code);
    const isPresent = checkLanguagesPresent(item, 'en-US');
    const areAllPresent = allLanguages.every((lang) =>
      checkLanguagesPresent(item, lang)
    );
    expect(isPresent).toBeTruthy();
    expect(areAllPresent).toBeFalsy();
  });

  it('should check if all languages are present in item when no specific language is provided', () => {
    const item = {
      outputs: {
        'en-US': 'output1',
        'es-US': 'output2',
      },
    };
    const result = checkLanguagesPresent(item, null);
    expect(result).toBeFalsy();
  });

  it('should handle when item.outputs is not defined and no specific language is provided', () => {
    const itemWithoutOutputs = {};
    const result = checkLanguagesPresent(itemWithoutOutputs, null);
    expect(result).toBeFalsy();
  });
});
