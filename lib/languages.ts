export enum Gender {
  male = 'MALE',
  female = 'FEMALE',
}

const languages: Record<string, any> = {
  wave1: [
    {
      code: 'cmn-CN',
      items: [{ name: 'Zhiyu', news: false, gender: Gender.female }],
      translate: 'zh',
    },
    {
      code: 'en-US',
      items: [
        // { name: 'Joanna', news: true, gender: Gender.female },
        { name: 'Matthew', news: true, gender: Gender.male },
      ],
      translate: 'en',
    },
    {
      code: 'es-US',
      items: [
        // { name: 'Lupe', news: true, gender: Gender.female  }
        { name: 'Pedro', news: true, gender: Gender.male },
      ],
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
      items: [
        // { name: 'Hala', news: false, gender: Gender.female },
        { name: 'Zayd', news: false, gender: Gender.male },
      ],
    },
    {
      code: 'fr-FR',
      translate: 'fr',
      items: [
        // { name: 'Lea', news: false, gender: Gender.female },
        { name: 'Remi', news: false, gender: Gender.male },
      ],
    },
  ],
  // wave7: [

  //   { code: 'nl-BE', items: [{ name: 'Lisa', news: false }], translate: 'nl', gender: Gender.female },
  //   { code: 'ca-ES', items: [{ name: 'Arlet', news: false }], translate: 'ca', gender: Gender.female },
  //   {
  //     code: 'yue-CN',
  //     items: [{ name: 'Hiujin', news: false, gender: Gender.female }],
  //     translate: 'zh-TW',
  //   },
  // ],
  // wave2: [
  //   { code: 'da-DK', items: [{ name: 'Sofie', news: false }], translate: 'da' },
  //   { code: 'nl-NL', items: [{ name: 'Laura', news: false }], translate: 'nl' },
  //   {
  //     code: 'en-AU',
  //     items: [{ name: 'Olivia', news: false }],
  //     translate: 'en',
  //   },
  //   { code: 'en-GB', items: [{ name: 'Brian', news: true, gender: Gender.male }], translate: 'en' },
  //   { code: 'en-IN', items: [{ name: 'Kajal', news: false }], translate: 'en' },
  // ],
  // wave3: [
  //   { code: 'en-IE', items: [{ name: 'Niamh', news: false }], translate: 'en' },
  //   { code: 'en-NZ', items: [{ name: 'Aria', news: false }], translate: 'en' },
  //   {
  //     code: 'en-ZA',
  //     items: [{ name: 'Ayanda', news: false }],
  //     translate: 'en',
  //   },
  //   { code: 'fi-FI', items: [{ name: 'Suvi', news: false }], translate: 'fi' },

  // ],
  // wave4: [
  //   {
  //     code: 'fr-CA',
  //     translate: 'fr',
  //     items: [
  //       { name: 'Gabrielle', news: false },
  //       { name: 'Liam', news: false },
  //     ],
  //   },
  // {
  //   code: 'fr-BE',
  //   items: [{ name: 'Isabelle', news: false, gender: Gender.female }],
  //   translate: 'fr',
  // },
  //   {
  //     code: 'de-DE',
  //     translate: 'de',
  //     items: [
  //       { name: 'Vicki', news: false },
  //       { name: 'Daniel', news: false },
  //     ],
  //   },
  //   {
  //     code: 'de-AT',
  //     items: [{ name: 'Hannah', news: false }],
  //     translate: 'de',
  //   },
  // ],
  // wave5: [
  //   {
  //     code: 'it-IT',
  //     translate: 'it',
  //     items: [
  //       { name: 'Bianca', news: false },
  //       { name: 'Adriano', news: false },
  //     ],
  //   },
  //   {
  //     code: 'ja-JP',
  //     translate: 'ja',
  //     items: [
  //       { name: 'Takumi', news: false },
  //       { name: 'Kazuha', news: false },
  //       { name: 'Tomoko', news: false },
  //     ],
  //   },
  //   {
  //     code: 'ko-KR',
  //     items: [{ name: 'Seoyeon', news: false }],
  //     translate: 'ko',
  //   },
  //   { code: 'pl-PL', items: [{ name: 'Ola', news: false }], translate: 'pl' },
  // ],
  // wave6: [
  //   {
  //     code: 'pt-BR',
  //     translate: 'pt',
  //     items: [
  //       { name: 'Camila', news: false },
  //       { name: 'Vitoria', news: false },
  //       { name: 'Thiago', news: false },
  //     ],
  //   },
  //   { code: 'pt-PT', items: [{ name: 'Ines', news: false }], translate: 'pt' },
  //   { code: 'sv-SE', items: [{ name: 'Elin', news: false }], translate: 'sv' },
  // ],
};

export { languages };
