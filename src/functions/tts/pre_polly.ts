import { delay, excapeSSMLCharacters } from '../../utils';

const prepareTitle = (title: string, byline: string): string => {
  return `<speak>${`${excapeSSMLCharacters(title)}<p>${excapeSSMLCharacters(
    byline
  )}</p>`}</speak>`;
};

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

