import { SFNClient, StartExecutionCommand } from '@aws-sdk/client-sfn';
import axios from 'axios';
import { load } from 'cheerio';
import { getArticlesTableInstance } from '../utils/dal';

const excapeSSMLCharacters = (text: string) => {
  return text
    .replace(/"/g, '&quot;')
    .replace(/&/g, '&amp;')
    .replace(/'/g, '&apos;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
};
const db = getArticlesTableInstance();
const client = new SFNClient();
const main = async (event: any, _context: any, callback: any) => {
  for (const record of event.Records) {
    const item = record.dynamodb.NewImage;

    if (
      record.eventName === 'INSERT' &&
      item.type?.S !== 'merge'
    ) {
      const uuid = item.uuid.S;
      const url = item.url.S;

      try {
        const response = await axios.get(`https://lite.cnn.com${url}`);
        const html = response.data;
        const $ = load(html);

        const title = $('.headline').text().trim();
        const byline = $('.byline--lite').text().trim();
        const text = $('.paragraph--lite:not(:last-child)')
          .map((index, element) => $(element).text().trim())
          .get()
          .join('\n');

        const input = {
          stateMachineArn: process.env.STATE_MACHINE_ARN,
          name: uuid,
          input: JSON.stringify({ uuid, url, title, text, byline }),
        };

        await db.updateTitle(uuid, title);

        const command = new StartExecutionCommand(input);
        const execution = await client.send(command);
        console.log(`Step Function execution started with title: ${title}`);
      } catch (error) {
        console.error('Error starting Step Function execution:', error);
      }
    }
  }
};

export { main };
