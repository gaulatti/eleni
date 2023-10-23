import {
  main,
} from '../../src/functions/pre_translate';

describe('PreTranslate Step Test', () => {
  it('should select a random voice and return the correct structure', async () => {
    const mockEvent = {
      language: {
        code: 'en-US',
        items: ['Voice1', 'Voice2', 'Voice3'],
        translate: false
      },
      title: 'Sample Title',
      text: 'Sample Text',
      byline: 'Sample Byline'
    };

    const result = await main(mockEvent, null, null);

    expect(result.language).toBe('en-US');
    expect(result.title).toBe('Sample Title');
    expect(result.text).toBe('Sample Text');
    expect(result.byline).toBe('Sample Byline');
    expect(result.translate).toBe(false);
    expect(mockEvent.language.items).toContain(result.selectedVoice);  // Check that selectedVoice is one of the items
  });
});
