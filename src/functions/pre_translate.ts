const main = async (event: any, _context: any, callback: any) => {
  const {
    language: { code, items, translate },
    title,
    text,
    byline,
  } = event;

  const selectedVoice = items[Math.floor(Math.random() * items.length)]

  return {
    language: code,
    selectedVoice,
    title,
    byline,
    translate,
    text
  };
};

export { main };
