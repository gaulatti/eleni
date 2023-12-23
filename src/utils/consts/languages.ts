export enum Gender {
  male = 'MALE',
  female = 'FEMALE',
}

export type Item = {
  name: string;
  news: boolean;
  gender: Gender;
};

export type LanguageObject = {
  code: string;
  items: Item[];
  translate: string;
};

/**
 * Array of language objects used by Polly.
 * @type {LanguageObject[]}
 */
const pollyLanguages: LanguageObject[] = [
  {
    code: 'en-US',
    items: [{ name: 'Matthew', news: true, gender: Gender.male }],
    translate: 'en',
  },
  {
    code: 'es-US',
    items: [{ name: 'Pedro', news: true, gender: Gender.male }],
    translate: 'es',
  },
  {
    code: 'fr-FR',
    translate: 'fr',
    items: [{ name: 'Remi', news: false, gender: Gender.male }],
  },
  {
    code: 'de-DE',
    translate: 'de',
    items: [{ name: 'Daniel', news: false, gender: Gender.male }],
  },
  {
    code: 'pt-BR',
    translate: 'pt',
    items: [{ name: 'Thiago', news: false, gender: Gender.male }],
  },
];

export { pollyLanguages };
