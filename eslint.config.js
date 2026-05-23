// eslint.config.js
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  // Игнорируем артефакты и генерацию
  { ignores: ['dist/', 'node_modules/', 'prisma/generated/', '**/coverage/'] },

  // Базовые JS-правила
  js.configs.recommended,

  // Отключаем конфликтующие с Prettier правила
  prettier,

  // TypeScript-правила с проверкой типов
  ...tseslint.configs.recommendedTypeChecked.map(config => ({
    ...config,
    files: ['**/*.ts', '**/*.mts', '**/*.cts'],
  })),

  {
    files: ['**/*.ts', '**/*.mts', '**/*.cts'],
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // 🛡️ Строгая работа с промисами (критично для Discord.js event handlers)
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-misused-promises': ['error', { checksVoidReturn: false }],
      '@typescript-eslint/await-thenable': 'warn',
			'@typescript-eslint/require-await': 'warn',
			'@typescript-eslint/no-redundant-type-constituents': 'warn',

      // 📝 Читаемость и типизация
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/strict-boolean-expressions': 'warn',
      '@typescript-eslint/prefer-optional-chain': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      'no-useless-escape': 'off',

      // 🚫 Discord.js & Prisma специфика
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      '@typescript-eslint/no-unnecessary-condition': 'warn',
    },
  }
);
