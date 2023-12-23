import { delay, excapeSSMLCharacters } from '../../utils';

/**
 * Prepares the title and byline for text-to-speech synthesis.
 *
 * @param title - The title of the content.
 * @param byline - The byline of the content.
 * @returns The prepared text in SSML format.
 */
const prepareTitle = (title: string, byline: string): string => {
  return `<speak>${`${excapeSSMLCharacters(title)}<p>${excapeSSMLCharacters(
    byline
  )}</p>`}</speak>`;
};

/**
 * Groups paragraphs of text into groups based on a maximum character limit.
 * Each group is wrapped in `<speak>` tags and each paragraph is wrapped in `<p>` tags.
 *
 * @param text - The text to be grouped into paragraphs.
 * @param maxCharacterLimit - The maximum character limit for each group.
 * @returns An array of grouped paragraphs, each wrapped in `<speak>` tags.
 */
const groupParagraphs = (text: string, maxCharacterLimit: number) => {
  const paragraphs = text.split('\n').map((item: string) => `<p>${item}</p>`);

  const paragraphGroups = [];
  let currentGroup: string[] = [];

  for (const paragraph of paragraphs) {
    if (currentGroup.join(' ').length + paragraph.length <= maxCharacterLimit) {
      currentGroup.push(paragraph);
    } else {
      if (currentGroup.length > 0) {
        paragraphGroups.push(`<speak>${currentGroup.join(' ')}</speak>`);
      }
      currentGroup = [paragraph];
    }
  }

  // Add the last group if not empty
  if (currentGroup.length > 0) {
    paragraphGroups.push(`<speak>${currentGroup.join(' ')}</speak>`);
  }

  return paragraphGroups;
};

/**
 * Main function for text-to-speech conversion using Polly.
 *
 * @param event - The event object containing the input data.
 * @param _context - The context object for the execution environment.
 * @param _callback - The callback function to be invoked after execution.
 * @returns The converted text-to-speech data.
 */
const main = async (event: any, _context: any, _callback: any) => {
  const { uuid, url, language, text, title, byline } = event;

  const preparedTitle = prepareTitle(title, byline);

  await delay(Math.random() * 2000);

  const selectedVoice =
    language.items[Math.floor(Math.random() * language.items.length)];

  const paragraphGroups = groupParagraphs(text, 2900).map((item: string) => ({
    text: item,
    voice: selectedVoice.name,
  }));

  return {
    uuid,
    url,
    title: preparedTitle,
    selectedVoice,
    language,
    text: paragraphGroups,
  };
};

export { groupParagraphs, main, prepareTitle };

