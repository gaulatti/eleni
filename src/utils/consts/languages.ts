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

const pollyLanguages: LanguageObject[] = [
  {
    code: 'cmn-CN',
    items: [{ name: 'Zhiyu', news: false, gender: Gender.female }],
    translate: 'zh',
  },
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
    code: 'hi-IN',
    items: [{ name: 'Kajal', news: false, gender: Gender.female }],
    translate: 'hi',
  },
  {
    code: 'ar-AE',
    translate: 'ar',
    items: [{ name: 'Zayd', news: false, gender: Gender.male }],
  },
  {
    code: 'fr-FR',
    translate: 'fr',
    items: [{ name: 'Remi', news: false, gender: Gender.male }],
  },

  {
    code: 'nl-BE',
    items: [{ name: 'Lisa', news: false, gender: Gender.female }],
    translate: 'nl',
  },
  {
    code: 'ca-ES',
    items: [{ name: 'Arlet', news: false, gender: Gender.female }],
    translate: 'ca',
  },
  {
    code: 'yue-CN',
    items: [{ name: 'Hiujin', news: false, gender: Gender.female }],
    translate: 'zh-TW',
  },
  {
    code: 'da-DK',
    items: [{ name: 'Sofie', news: false, gender: Gender.female }],
    translate: 'da',
  },
  {
    code: 'nl-NL',
    items: [{ name: 'Laura', news: false, gender: Gender.female }],
    translate: 'nl',
  },
  {
    code: 'en-AU',
    items: [{ name: 'Olivia', news: false, gender: Gender.female }],
    translate: 'en',
  },
  {
    code: 'en-GB',
    items: [{ name: 'Brian', news: true, gender: Gender.male }],
    translate: 'en',
  },
  {
    code: 'en-IN',
    items: [{ name: 'Kajal', news: false, gender: Gender.female }],
    translate: 'en',
  },
  {
    code: 'en-IE',
    items: [{ name: 'Niamh', news: false, gender: Gender.female }],
    translate: 'en',
  },
  {
    code: 'en-NZ',
    items: [{ name: 'Aria', news: false, gender: Gender.female }],
    translate: 'en',
  },
  {
    code: 'en-ZA',
    items: [{ name: 'Ayanda', news: false, gender: Gender.female }],
    translate: 'en',
  },
  {
    code: 'fi-FI',
    items: [{ name: 'Suvi', news: false, gender: Gender.female }],
    translate: 'fi',
  },
  {
    code: 'fr-CA',
    translate: 'fr',
    items: [{ name: 'Liam', news: false, gender: Gender.male }],
  },
  {
    code: 'fr-BE',
    items: [{ name: 'Isabelle', news: false, gender: Gender.female }],
    translate: 'fr',
  },
  {
    code: 'de-DE',
    translate: 'de',
    items: [{ name: 'Daniel', news: false, gender: Gender.male }],
  },
  {
    code: 'de-AT',
    items: [{ name: 'Hannah', news: false, gender: Gender.female }],
    translate: 'de',
  },
  {
    code: 'it-IT',
    translate: 'it',
    items: [{ name: 'Adriano', news: false, gender: Gender.male }],
  },
  {
    code: 'ja-JP',
    translate: 'ja',
    items: [{ name: 'Takumi', news: false, gender: Gender.male }],
  },
  {
    code: 'ko-KR',
    items: [{ name: 'Seoyeon', news: false, gender: Gender.female }],
    translate: 'ko',
  },
  {
    code: 'pl-PL',
    items: [{ name: 'Ola', news: false, gender: Gender.female }],
    translate: 'pl',
  },
  {
    code: 'pt-BR',
    translate: 'pt',
    items: [{ name: 'Thiago', news: false, gender: Gender.male }],
  },
  {
    code: 'pt-PT',
    items: [{ name: 'Ines', news: false, gender: Gender.female }],
    translate: 'pt',
  },
  {
    code: 'sv-SE',
    items: [{ name: 'Elin', news: false, gender: Gender.female }],
    translate: 'sv',
  },
];

export { pollyLanguages };
