import { SFNClient, StartExecutionCommand } from '@aws-sdk/client-sfn';
import axios from 'axios';
import { load } from 'cheerio';
import { getArticlesTableInstance } from '../utils/dal';
import { pollyLanguages } from '../utils/consts/languages';
import { unmarshall } from '@aws-sdk/util-dynamodb';

const db = getArticlesTableInstance();
const client = new SFNClient();

const main = async (event: any, _context: any, _callback: any) => {
  for (const record of event.Records) {
    const item = unmarshall(record.dynamodb.NewImage);

    if (record.eventName === 'INSERT') {
      const uuid: string = item.uuid;
      const url: string = item.url;

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

        await db.updateTitle(uuid, title);

        for (const language of pollyLanguages) {
          const input = {
            stateMachineArn: process.env.STATE_MACHINE_ARN,
            name: `${uuid}-${language.code}`,
            input: JSON.stringify({ uuid, url, title, text, byline, language }),
          };
          const command = new StartExecutionCommand(input);
          const execution = await client.send(command);
          console.log(`Step Function execution started`, {
            title,
            language,
            execution,
            command
          });
        }
      } catch (error) {
        console.error('Error starting Step Function execution:', error);
      }
    }
  }
};

export { main };
