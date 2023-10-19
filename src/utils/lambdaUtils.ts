const excapeSSMLCharacters = (text: string) => {
  return text
    .replace(/"/g, '&quot;')
    .replace(/&/g, '&amp;')
    .replace(/'/g, '&apos;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
};

const delay = async (milliseconds = 1000) => {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
};

export { excapeSSMLCharacters, delay };
