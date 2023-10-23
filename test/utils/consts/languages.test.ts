import { Gender, LanguageObject, Item, pollyLanguages } from '../../../src/utils/consts/languages';

describe('pollyLanguages', () => {
  it('should be an array', () => {
    expect(Array.isArray(pollyLanguages)).toBeTruthy();
  });

  it('should contain items that conform to the LanguageObject type', () => {
    pollyLanguages.forEach(language => {
      expect(typeof language.code).toBe('string');
      expect(typeof language.translate).toBe('string');
      expect(Array.isArray(language.items)).toBeTruthy();

      // Check each item inside items array
      language.items.forEach(item => {
        expect(typeof item.name).toBe('string');
        expect(typeof item.news).toBe('boolean');
        expect(Object.values(Gender)).toContain(item.gender);
      });
    });
  });
});

describe('Gender Enum', () => {
  it('should define male as MALE', () => {
    expect(Gender.male).toBe('MALE');
  });

  it('should define female as FEMALE', () => {
    expect(Gender.female).toBe('FEMALE');
  });
});
