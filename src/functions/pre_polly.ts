import { delay, excapeSSMLCharacters } from '../utils';

const prepareTitle = (title: string, byline: string): string => {
  return `<speak>${`${excapeSSMLCharacters(title)}<p>${excapeSSMLCharacters(
    byline
  )}</p>`}</speak>`;
};

const groupParagraphs = (text: string, maxCharacterLimit: number) => {
  const paragraphs = text
    .split('\n')
    .map((item: string) => `<p>${item}</p>`);

  const paragraphGroups = [];
  let currentGroup: string[] = [];

  for (const paragraph of paragraphs) {
    if (currentGroup.join(' ').length + paragraph.length <= maxCharacterLimit) {
      currentGroup.push(paragraph);
    } else {
      if (currentGroup.length > 0) {  // Check if currentGroup is not empty
        paragraphGroups.push(
          `<speak>${currentGroup.join(' ')}</speak>`
        );
      }
      currentGroup = [paragraph];
    }
  }

  // Add the last group if not empty
  if (currentGroup.length > 0) {
    paragraphGroups.push(
      `<speak>${currentGroup.join(' ')}</speak>`
    );
  }

  return paragraphGroups;
}


const main = async (event: any, _context: any, callback: any) => {
  const { selectedVoice, language, text, title, byline } = event;

  const preparedTitle = prepareTitle(title, byline);

  await delay(Math.random() * 2000);

  const paragraphGroups = groupParagraphs(text, 2900);

  const textInput = paragraphGroups.map((text) => ({
    text,
    language,
    selectedVoice,
  }));

  return { title: preparedTitle, selectedVoice, language, textInput };
};

export { groupParagraphs, prepareTitle, main };
