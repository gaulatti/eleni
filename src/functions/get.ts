import { v4 as uuidv4 } from 'uuid';
import { getArticlesTableInstance } from '../utils/dal/articles';
import {
  checkLanguagesPresent,
  delay,
  extractPathWithTrailingSlash,
  lambdaHttpOutput,
  sanitizeGetInputs,
} from '../utils';

const db = getArticlesTableInstance();

const main = async (event: any, _context: any, _callback: any) => {
  try {
    const { articleId, href, language } = sanitizeGetInputs(event);
    if (!articleId && !href) throw new Error('Missing articleId or url');
    let existingItem, url, uuid;

    if (articleId) {
      existingItem = await db.get(articleId);
    }

    if(href) {
      url = extractPathWithTrailingSlash(href);
    }

    /**
     * If existingItem can't be found by UUID, try to find it by URL
     */
    if (!existingItem) {
      existingItem = await db.queryByUrl(url);
    }

    /**
     * If there's no existing item, create a new one
     */
    if (!existingItem) {
      /**
       * If there's no URL, return 404. We need the URL to crawl the page
       */
      if (!url) return lambdaHttpOutput(404);
      const createResponse = await db.create(uuidv4(), url);
      uuid = createResponse.uuid;
      console.log(`Created record for ${url}`);
      existingItem = await db.get(uuid);
    } else {
      uuid = existingItem.uuid;
    }

    /**
     * If we're only looking for one language, if
     * that language exists we can return the item.
     *
     * Otherwise, we wait until all languages are generated.
     */
    while (!checkLanguagesPresent(existingItem, language)) {
      await delay(1000);
      existingItem = await db.get(uuid);
    }

    return lambdaHttpOutput(200, existingItem);
  } catch (error) {
    console.error('Error:', error);
    return lambdaHttpOutput(500, error);
  }
};

export { main };
