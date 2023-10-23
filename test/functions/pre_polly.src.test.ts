import {
  groupParagraphs,
  main,
  prepareTitle,
} from '../../src/functions/pre_polly';

jest.mock('../../src/utils', () => ({
  delay: jest.fn(),
  excapeSSMLCharacters: (str: string) => str,
}));

describe('PrePolly Step Test', () => {
  describe('prepareTitle', () => {
    it('should return the correctly formatted title', () => {
      const title = 'Test Title';
      const byline = 'By Author';
      const expectedOutput = `<speak>Test Title<p>By Author</p></speak>`;

      expect(prepareTitle(title, byline)).toBe(expectedOutput);
    });
  });

  describe('groupParagraphs', () => {
    it('should group paragraphs without exceeding the maxCharacterLimit', () => {
      const text = "This is paragraph 1.\nThis is paragraph 2.";
      const maxCharacterLimit = 25; // intentionally small for testing purposes
      const expectedOutput = [
        `<speak><p>This is paragraph 1.</p></speak>`,
        `<speak><p>This is paragraph 2.</p></speak>`
      ];

      expect(groupParagraphs(text, maxCharacterLimit)).toEqual(expectedOutput);
    });
    
    it('should combine paragraphs if they do not exceed the maxCharacterLimit', () => {
      const text = 'Para 1.\nPara 2.';
      const maxCharacterLimit = 50;
      const expectedOutput = [`<speak><p>Para 1.</p> <p>Para 2.</p></speak>`];

      expect(groupParagraphs(text, maxCharacterLimit)).toEqual(expectedOutput);
    });
  });


  describe('main', () => {
    it('should correctly process the input event', async () => {
      const mockEvent = {
        selectedVoice: 'Amy',
        language: 'en-US',
        text: 'This is a test.\nHello world.',
        title: 'Test Title',
        byline: 'By Author',
      };

      const expectedOutput = {
        title: `<speak>Test Title<p>By Author</p></speak>`,
        selectedVoice: 'Amy',
        language: 'en-US',
        textInput: [
          {
            text: `<speak><p>This is a test.</p> <p>Hello world.</p></speak>`,
            language: 'en-US',
            selectedVoice: 'Amy',
          },
        ],
      };

      expect(await main(mockEvent, {}, {})).toEqual(expectedOutput);
    });
  });
});
