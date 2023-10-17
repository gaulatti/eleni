const excapeSSMLCharacters = (text: string) => {
  return text
    .replace(/"/g, '&quot;')
    .replace(/&/g, '&amp;')
    .replace(/'/g, '&apos;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
};

const wrapNews = (
  selectedVoice: { news: boolean; name: string },
  text: string
) => {
  if (selectedVoice.news) {
    return `<amazon:domain name='news'>${text}</amazon:domain>`;
  } else {
    return text;
  }
};

const main = async (event: any, _context: any, callback: any) => {
  const { selectedVoice, language, text, title, byline } = event;
  const preparedTitle = `<speak>${wrapNews(
    selectedVoice,
    `${excapeSSMLCharacters(title)}<p>${excapeSSMLCharacters(byline)}</p>`
  )}</speak>`;

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
        `<speak>${wrapNews(selectedVoice, currentGroup.join(' '))}</speak>`
      );
      currentGroup = [paragraph];
    }
  }

  // Add the last group if not empty
  if (currentGroup.length > 0) {
    paragraphGroups.push(
      `<speak>${wrapNews(selectedVoice, currentGroup.join(' '))}</speak>`
    );
  }

  const textInput = paragraphGroups.map((text) => ({ text, language, selectedVoice }));

  return { title: preparedTitle, selectedVoice, language, textInput };
};

export { main };
