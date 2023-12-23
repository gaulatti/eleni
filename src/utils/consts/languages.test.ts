import { Gender, pollyLanguages } from './languages';

describe('pollyLanguages', () => {
  it('should have the correct number of language objects', () => {
    expect(pollyLanguages.length).toEqual(5);
  });

  it('should have the correct properties for each language object', () => {
    pollyLanguages.forEach((language) => {
      expect(language).toHaveProperty('code');
      expect(language).toHaveProperty('items');
      expect(language).toHaveProperty('translate');
    });
  });

  it('should have the correct properties for each item in the items array', () => {
    pollyLanguages.forEach((language) => {
      language.items.forEach((item) => {
        expect(item).toHaveProperty('name');
        expect(item).toHaveProperty('news');
        expect(item).toHaveProperty('gender');
      });
    });
  });

  it('should have the correct values for the code property', () => {
    const expectedCodes = ['en-US', 'es-US', 'fr-FR', 'de-DE', 'pt-BR'];
    const codes = pollyLanguages.map((language) => language.code);
    expect(codes).toEqual(expectedCodes);
  });

  it('should have the correct values for the translate property', () => {
    const expectedTranslations = ['en', 'es', 'fr', 'de', 'pt'];
    const translations = pollyLanguages.map((language) => language.translate);
    expect(translations).toEqual(expectedTranslations);
  });

  it('should have the correct values for the items property', () => {
    const expectedItems = [
      [{ name: 'Matthew', news: true, gender: Gender.male }],
      [{ name: 'Pedro', news: true, gender: Gender.male }],
      [{ name: 'Remi', news: false, gender: Gender.male }],
      [{ name: 'Daniel', news: false, gender: Gender.male }],
      [{ name: 'Thiago', news: false, gender: Gender.male }],
    ];
    const items = pollyLanguages.map((language) => language.items);
    expect(items).toEqual(expectedItems);
  });
});