import axios from 'axios';
import { load } from 'cheerio';
import { getDbInstance } from '../utils/dal';

const db = getDbInstance();

const main = async (event: any, _context: any, callback: any) => {
  try {
    const response = await axios.get('https://lite.cnn.com');
    const html = response.data;

    const $ = load(html);

    const cardLiteElements = $('.card--lite');
    const scrapedData: {
      href: string;
      title: string;
    }[] = [];

    cardLiteElements.each((index, element) => {
      const anchorElement = $(element).find('a');

      const href = anchorElement.attr('href') || '';
      const title = anchorElement.text().trim() || '';

      scrapedData.push({ href, title });
    });

    const existingRecords = await db.list() || [];

    /**
     * Create DB Record
     */
    for (const { href, title } of scrapedData) {
      // Check if the href already exists in the existingRecords array
      const existingRecord = existingRecords.find((record) => record.url === href);

      if (existingRecord) {
        console.log(`Skipping ${href} as it already exists`);
        continue;
      }

      await db.create(href, title);
    }

    console.log(scrapedData);

    console.log(scrapedData);

    return callback(null, {});
  } catch (error) {
    console.error('Error:', error);
    return callback(error, {});
  }
};

export { main };
