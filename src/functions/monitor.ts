import axios from 'axios';
import { load } from 'cheerio';
import { getArticlesTableInstance } from '../utils/dal';

const db = getArticlesTableInstance();
import { v4 as uuidv4 } from 'uuid';

const main = async (event: any, _context: any, callback: any) => {
  try {
    const response = await axios.get('https://lite.cnn.com');
    const html = response.data;

    const $ = load(html);

    const cardLiteElements = $('.card--lite');
    const scrapedData: {
      href: string;
    }[] = [];

    cardLiteElements.each((index, element) => {
      const anchorElement = $(element).find('a');

      const href = anchorElement.attr('href') || '';

      scrapedData.push({ href });
    });

    const existingRecords = (await db.list()) || [];

    /**
     * Pre-filter scrapedData to remove duplicates
     */
    const uniqueScrapedData = scrapedData.filter(({ href }) => {
      return !existingRecords.some((record) => record.url === href);
    });

    /**
     * Create DB Record for unique scrapedData
     */
    for (const { href } of uniqueScrapedData) {
      const uuid = uuidv4();
      await db.create(uuid, href);
      console.log(`Created record for ${href}`);
    }

    return callback(null, {});
  } catch (error) {
    console.error('Error:', error);
    return callback(error, {});
  }
};

export { main };
