import { SFNClient, StartExecutionCommand } from '@aws-sdk/client-sfn';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import axios from 'axios';
import { load } from 'cheerio';
import { pollyLanguages } from '../utils/consts/languages';
import { getArticlesTableInstance } from '../utils/dal/articles';

const db = getArticlesTableInstance();
const client = new SFNClient();

const fetchAndParseArticle = async (url: string) => {
  const response = await axios.get(`https://lite.cnn.com${url}`);
  const html = response.data;
  const $ = load(html);

  const title = $('.headline').text().trim();
  const byline = $('.byline--lite').text().trim();
  const text = $('.paragraph--lite:not(:last-child)')
    .map((index, element) => $(element).text().trim())
    .get()
    .join('\n');

  return { title, byline, text };
};

const startStepFunctionExecution = async (
  uuid: string,
  url: string,
  title: string,
  text: string,
  byline: string,
  language: any
) => {
  const input = {
    stateMachineArn: process.env.STATE_MACHINE_ARN,
    name: `${uuid}-${language.code}`,
    input: JSON.stringify({ uuid, url, title, text, byline, language }),
  };
  const command = new StartExecutionCommand(input);
  const execution = await client.send(command);
  return execution;
};

const main = async (event: any) => {
  for (const record of event.Records) {
    const item = unmarshall(record.dynamodb.NewImage);

    if (record.eventName === 'INSERT') {
      const uuid: string = item.uuid;
      const url: string = item.url;

      try {
        const { title, byline, text } = await fetchAndParseArticle(url);
        await db.updateTitle(uuid, title);

        for (const language of pollyLanguages) {
          const execution = await startStepFunctionExecution(
            uuid,
            url,
            title,
            text,
            byline,
            language
          );
          console.log(`Step Function execution started`, {
            title,
            language,
            execution,
          });
        }
      } catch (error) {
        console.error('Error:', error);
      }
    }
  }
};

export { fetchAndParseArticle, startStepFunctionExecution, main };
