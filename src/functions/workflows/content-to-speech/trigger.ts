import { SFNClient, StartExecutionCommand } from '@aws-sdk/client-sfn';
import axios from 'axios';
import { load } from 'cheerio';
import { pollyLanguages } from '../../../utils/consts/languages';
import { getContentTableInstance } from '../../../utils/dal/content';

const db = getContentTableInstance(process.env.TABLE_NAME!);
const client = new SFNClient();

/**
 * Fetches and parses an article from a given URL.
 * @param url - The URL of the article to fetch and parse.
 * @returns An object containing the title, byline, and text of the article.
 */
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

/**
 * Starts the execution of a Step Function workflow.
 *
 * @param uuid - The UUID of the workflow.
 * @param url - The URL of the content.
 * @param title - The title of the content.
 * @param text - The text of the content.
 * @param byline - The byline of the content.
 * @param language - The language of the content.
 * @returns A promise that resolves to the execution details.
 */
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

/**
 * Main function that processes the event records and triggers the content-to-speech workflow.
 *
 * @param event - The event object containing the records to process.
 */
const main = async (event: any) => {
  for (const record of event.Records) {
    const item = record.dynamodb.NewImage;

    if (record.eventName === 'INSERT') {
      const uuid: string = item.uuid.S;
      const url: string = item.url.S;

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

export { fetchAndParseArticle, main, startStepFunctionExecution };
