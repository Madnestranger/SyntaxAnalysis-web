// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.

export const environment = {
  production: false,
  version: '(dev)',
  serverUrl: 'http://localhost:48748/',
  defaultLanguage: 'en-US',
  supportedLanguages: [
    'ua-RU',
    'en-US',
    'fr-FR',
    'es-ES',
    'ru-RU'
  ]
};
