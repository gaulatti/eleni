import { SFNClient, StartExecutionCommand } from '@aws-sdk/client-sfn';
import axios from 'axios';
import { load } from 'cheerio';

const client = new SFNClient();
const main = async (event: any, _context: any, callback: any) => {
  for (const record of event.Records) {
    const item = record.dynamodb.NewImage;

    if (record.eventName === 'INSERT') {
      const url = item.url.S;
      const title = item.title.S;

      try {
        const response = await axios.get(`https://lite.cnn.com${url}`);
        const html = response.data;
        const $ = load(html);

        const paragraphs = $('.paragraph--lite:not(:last-child)')
          .map((index, element) => $(element).text().trim())
          .get();

        const input = {
          stateMachineArn: process.env.STATE_MACHINE_ARN,
          name: `Execution-${Date.now()}`,
          input: JSON.stringify({ url, title, paragraphs }),
        };

        const command = new StartExecutionCommand(input);
        const execution = await client.send(command);
        console.log(execution);

        console.log(`Step Function execution started with title: ${title}`);
      } catch (error) {
        console.error('Error starting Step Function execution:', error);
      }
    }
  }
};

export { main };
