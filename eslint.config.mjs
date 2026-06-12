import antfu from '@antfu/eslint-config'
import globals from 'globals'

const sharedRules = {
  'no-console': 'off',
  'no-undef': 'off',
  'no-unused-vars': 'off',
  'e18e/prefer-static-regex': 'off',
  'style/max-statements-per-line': 'off',
  'style/no-mixed-operators': 'off',
  'antfu/consistent-list-newline': ['error', {
    ObjectExpression: false,
  }],
  'style/object-curly-newline': ['error', {
    consistent: true,
    multiline: true,
  }],
  'style/object-property-newline': ['error', {
    allowAllPropertiesOnSameLine: false,
  }],
  'unused-imports/no-unused-vars': ['warn', {
    args: 'after-used',
    argsIgnorePattern: '^_',
    varsIgnorePattern: '^_',
  }],
  'ts/no-empty-object-type': 'off',
  'max-depth': ['warn', 3],
  '@typescript-eslint/no-explicit-any': 'warn',
  'vue/custom-event-name-casing': 'off',
  'vue/no-template-shadow': 'off',
}

export default antfu(
  {
    vue: true,
    typescript: true,
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/dist-ssr/**',
      '**/coverage/**',
      '**/.turbo/**',
      '**/*.tsbuildinfo',
      '**/*.md',
      '.agents/**',
      '.claude/**',
      'apps/server/build/**',
      'apps/server/documentation/**',
      'apps/web-admin/docs/**',
      'apps/web-user/.eslintcache',
      'apps/web-user/__screenshots__/**',
      'apps/web-user/cypress/screenshots/**',
      'apps/web-user/cypress/videos/**',
      'docs',
    ],
    rules: sharedRules,
  },
  {
    files: [
      '*.{js,ts,mjs,cjs}', // 根目录所有脚本文件均为 Node 环境
      'scripts/**/*.{js,ts,mjs,cjs}',
      'apps/server/**/*.{js,ts}',
      'apps/web-admin/*.{js,ts}',
      'apps/web-admin/{vite,vitest}.config.ts',
      'apps/web-user/*.{js,ts}',
      'apps/web-user/{vite,vitest}.config.js',
      'apps/web-user/mock/**/*.{js,ts}',
      'apps/web-user/server/**/*.js',
    ],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      'e18e/prefer-object-has-own': 'off',
      'node/prefer-global/buffer': 'off',
      'node/prefer-global/process': 'off',
      'unicorn/prefer-object-has-own': 'off',
    },
  },
  {
    files: ['apps/server/**/*.ts'],
    rules: {
      'ts/consistent-type-imports': 'off',
    },
  },
  {
    files: [
      'apps/server/**/*.spec.ts',
      'apps/server/test/**/*.ts',
    ],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
  },
  // web-admin FSD import boundaries (shared < entities < features < widgets < pages < app).
  // Currently 'warn' only — reporting, not blocking. Promotion to 'error' is staged;
  // see docs/architecture/import-boundaries.md. Use `pnpm lint:boundaries` for a focused report.
  {
    files: ['apps/web-admin/**/*.{js,ts,tsx,vue}'],
    rules: {
      'no-restricted-imports': ['warn', {
        patterns: [
          {
            group: ['@/views/**'],
            message: '页面业务请迁移到 features 目录，不要继续跨层引用 views。',
          },
          {
            group: ['@/features/*/pages/**'],
            message: '禁止直接引用其他 feature 的 page。',
          },
        ],
      }],
    },
  },
  {
    files: ['apps/web-admin/src/shared/**/*.{js,ts,tsx,vue}'],
    rules: {
      'no-restricted-imports': ['warn', {
        patterns: [
          {
            group: [
              '@/app/**',
              '@/entities/**',
              '@/features/**',
              '@/pages/**',
              '@/widgets/**',
            ],
            message: 'shared is the lowest web-admin layer and must not import upper layers.',
          },
        ],
      }],
    },
  },
  {
    files: ['apps/web-admin/src/entities/**/*.{js,ts,tsx,vue}'],
    rules: {
      'no-restricted-imports': ['warn', {
        patterns: [
          {
            group: [
              '@/app/**',
              '@/features/**',
              '@/pages/**',
              '@/widgets/**',
            ],
            message: 'entities may depend on shared only, not on app/features/pages/widgets.',
          },
        ],
      }],
    },
  },
  {
    files: ['apps/web-admin/src/features/**/*.{js,ts,tsx,vue}'],
    rules: {
      'no-restricted-imports': ['warn', {
        patterns: [
          {
            group: [
              '@/app/**',
              '@/pages/**',
              '@/widgets/**',
            ],
            message: 'features may depend on entities and shared, not on app/pages/widgets.',
          },
        ],
      }],
    },
  },
  {
    files: ['apps/web-admin/src/widgets/**/*.{js,ts,tsx,vue}'],
    rules: {
      'no-restricted-imports': ['warn', {
        patterns: [
          {
            group: [
              '@/app/**',
              '@/pages/**',
            ],
            message: 'widgets may depend on entities/features/shared, not on app/pages.',
          },
        ],
      }],
    },
  },
  {
    files: ['apps/web-admin/**/*.vue'],
    rules: {
      'vue/html-indent': ['error', 2, {
        attribute: 1,
        baseIndent: 1,
        closeBracket: 0,
        alignAttributesVertically: false,
        ignores: [],
      }],
      'vue/max-attributes-per-line': ['error', {
        singleline: {
          max: 3,
        },
        multiline: {
          max: 1,
        },
      }],
      'vue/html-closing-bracket-newline': ['error', {
        singleline: 'never',
        multiline: 'always',
      }],
      'vue/first-attribute-linebreak': ['error', {
        singleline: 'ignore',
        multiline: 'below',
      }],
    },
  },
  {
    files: ['apps/web-user/**/*.vue'],
    rules: {
      'vue/html-indent': 'off',
      'vue/html-closing-bracket-newline': 'off',
      'vue/first-attribute-linebreak': 'off',
    },
  },
)
