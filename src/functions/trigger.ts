import { SFNClient, StartExecutionCommand } from '@aws-sdk/client-sfn';
import axios from 'axios';
import { load } from 'cheerio';

const client = new SFNClient();
const main = async (event: any, _context: any, callback: any) => {
  for (const record of event.Records) {
    const item = record.dynamodb.NewImage;

    if (record.eventName === 'INSERT') {
      const url = item.url.S;
      const articleTitle = item.title.S;

      try {
        const response = await axios.get(`https://lite.cnn.com${url}`);
        const html = response.data;
        const $ = load(html);

        const paragraphs = $('.paragraph--lite:not(:last-child)')
          .map((index, element) => `<p>${$(element).text().trim()}</p>`)
          .get();

        const maxCharacterLimit = 2900;
        const paragraphGroups = [];
        let currentGroup: string[] = [];

        for (const paragraph of paragraphs) {
          if (
            currentGroup.join(' ').length + paragraph.length <=
            maxCharacterLimit
          ) {
            currentGroup.push(paragraph);
          } else {
            paragraphGroups.push(currentGroup.join(' '));
            currentGroup = [paragraph];
          }
        }

        // Add the last group if not empty
        if (currentGroup.length > 0) {
          paragraphGroups.push(currentGroup.join(' '));
        }

        const byline = $('.byline--lite').text().trim();
        /**
         * TODO: <amazon:domain name="news"> is not supported in SSML voice (as per the errors)
         * but it is supported in SSML speech (as per the docs). I'm not sure why this is the case.
         */
        const title = `<speak>${articleTitle}<p>${byline}</p></speak>`;

        const input = {
          stateMachineArn: process.env.STATE_MACHINE_ARN,
          name: `Execution-${Date.now()}`,
          input: JSON.stringify({ url, title, paragraphGroups }),
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
