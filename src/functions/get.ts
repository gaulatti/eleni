import { v4 as uuidv4 } from 'uuid';
import { getDbInstance } from '../utils/dal';
import { delay } from '../utils/lambdaUtils';

const db = getDbInstance();

const extractPathWithTrailingSlash = (url: string) => {
  // Define the regular expression pattern with capturing group
  const regex = /^https?:\/\/([a-zA-Z0-9_-]+\.)?cnn\.com\/(.*)/;

  // Use the RegExp.exec() method to match the pattern
  const match = regex.exec(url);

  // Check if a match was found and if the path is not empty
  if (match && match[2]) {
    // The captured group at index 2 contains the path with the trailing slash
    return '/' + match[2];
  }

  // If no match was found or the path is empty, return null or handle the case accordingly
  return null;
};

const main = async (event: any, _context: any, callback: any) => {
  try {
    const { httpMethod, pathParameters = {}, body = '{}' } = event;

    const articleId =
      httpMethod === 'POST'
        ? JSON.parse(body).articleId
        : pathParameters.articleId;
    const href = httpMethod === 'POST' ? JSON.parse(body).url : null;

    if (!articleId && !href) {
      throw new Error('Missing articleId or url');
    }

    const url = extractPathWithTrailingSlash(href);

    if (articleId) {
      let output = await db.get(articleId);

      if (output) {
        return {
          statusCode: 200,
          body: JSON.stringify(output),
        };
      }
    }

    const existingRecords = (await db.list()) || [];
    const existingItem = existingRecords.find((record) => record.url === url);
    if (existingItem) {
      let output = existingItem;

      return {
        statusCode: 200,
        body: JSON.stringify(output),
      };
    }

    /**
     * Create DB Record for unique scrapedData if it doesn't exist
     */
    if (url) {
      const uuid = uuidv4();

      await db.create(uuid, url);
      console.log(`Created record for ${url}`, { uuid });

      if (process.env.LANGUAGES) {
        const envLanguages = JSON.parse(process.env.LANGUAGES);
        const languageCodes = envLanguages.map((item: any) => item.code);
        let allItemsPresent = false;
        let item;

        while (!allItemsPresent) {
          await delay(1000)
          item = await db.get(uuid);

          if (item) {
            const outputs = item!.outputs || {};
            const outputKeys = Object.keys(outputs) || [];
            allItemsPresent = languageCodes.every((item: string) =>
              outputKeys.includes(item)
            );
          } else {
            return {
              statusCode: 201,
              body: JSON.stringify({ uuid, url }),
            };
          }
        }

        return {
          statusCode: 200,
          body: JSON.stringify(item),
        };
      } else {
        return {
          statusCode: 201,
          body: JSON.stringify({ uuid, url }),
        };
      }
    }

    return {
      statusCode: 404,
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify(error),
    };
  }
};

export { main };
