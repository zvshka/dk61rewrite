// prettier.config.js
/** @type {import('prettier').Config} */
export default {
  semi: true,
  trailingComma: 'es5',
  singleQuote: true,
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  endOfLine: 'crlf',
  bracketSpacing: true,
  arrowParens: 'avoid',
  overrides: [
    // Prisma файлы не форматируем через Prettier (используем встроенный `prisma format`)
    { files: '*.prisma', options: { parser: 'prisma' } },
  ],
};
