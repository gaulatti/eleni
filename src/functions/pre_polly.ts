import { delay, excapeSSMLCharacters } from '../utils';

const main = async (event: any, _context: any, callback: any) => {
  const { selectedVoice, language, text, title, byline } = event;
  const preparedTitle = `<speak>${`${excapeSSMLCharacters(title)}<p>${excapeSSMLCharacters(byline)}</p>`}</speak>`;

  const delayAmount = Math.random() * 2000;
  await delay(delayAmount);

  const paragraphs = text
    .split('\n')
    .map((item: string) => `<p>${excapeSSMLCharacters(item)}</p>`);

  const maxCharacterLimit = 2900;
  const paragraphGroups = [];
  let currentGroup: string[] = [];

  for (const paragraph of paragraphs) {
    if (currentGroup.join(' ').length + paragraph.length <= maxCharacterLimit) {
      currentGroup.push(paragraph);
    } else {
      paragraphGroups.push(
        `<speak>${currentGroup.join(' ')}</speak>`
      );
      currentGroup = [paragraph];
    }
  }

  // Add the last group if not empty
  if (currentGroup.length > 0) {
    paragraphGroups.push(
      `<speak>${currentGroup.join(' ')}</speak>`
    );
  }

  const textInput = paragraphGroups.map((text) => ({ text, language, selectedVoice }));

  return { title: preparedTitle, selectedVoice, language, textInput };
};

export { main };
