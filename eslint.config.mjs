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

// 测试需要直接构造 Controller/Prisma mock；这两个现有导入 CLI 是组合根，不属于请求业务链路。
// 只排除已知脚本位置，不把整个 modules/**/scripts/** 变成不受约束的区域。
const serverBoundaryIgnores = [
  '**/*.spec.ts',
  '**/*.test.ts',
  '**/tests/**',
  '**/__tests__/**',
  'apps/server/src/modules/elm-media/scripts/import-images.ts',
  'apps/server/src/modules/elm-upstream/scripts/import-upstream.ts',
]

// 同时匹配 @/ 别名和 ../ 等常规相对路径，不能只检查别名而漏掉后端实际使用的导入方式。
// 这是静态 import/export 的路径约束，不解析完整依赖图或动态 require/import。
const serverSourceImportPrefix = String.raw`^(?:@/|(?:\.{1,2}/)+)`

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
      'apps/server/src/generated/**',
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
  {
    name: 'server-boundaries/modules',
    files: ['apps/server/src/modules/**/*.ts'],
    ignores: serverBoundaryIgnores,
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [{
          regex: `${serverSourceImportPrefix}api(?:/|$)`,
          message: '业务模块不得反向依赖 api；共享业务类型应留在 modules 或框架无关的 contracts 中。',
        }],
      }],
    },
  },
  {
    name: 'server-boundaries/api',
    files: ['apps/server/src/api/**/*.ts'],
    ignores: serverBoundaryIgnores,
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [{
          regex: String.raw`^(?:@prisma(?:/|$)|prisma(?:/|$)|(?:@/|(?:\.{1,2}/)+)(?:prisma|generated/prisma)(?:/|$))`,
          message: '接口层不得直接依赖 Prisma Service、模块或客户端（含类型导入）；数据库访问应通过业务模块导出的 Service。',
        }],
      }],
    },
  },
  {
    name: 'server-boundaries/common',
    files: ['apps/server/src/common/**/*.ts'],
    ignores: serverBoundaryIgnores,
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [{
          regex: `${serverSourceImportPrefix}(?:modules|api)(?:/|$)`,
          message: 'common 不得依赖具体业务模块或 api；公共基础设施不能反向绑定业务或接口实现。',
        }],
      }],
    },
  },
  // web-admin 收敛后的页面私有业务留在 pages；布局复用 shared/entities。
  // 仅检查别名导入，不能替代相对路径跨页引用的人工核查；不影响上方后端边界。
  {
    files: ['apps/web-admin/src/shared/**/*.{js,ts,tsx,vue}'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [{
          group: ['@/app/**', '@/entities/**', '@/pages/**', '@/layouts/**'],
          message: 'shared 不得依赖应用装配、领域实体、页面或布局。',
        }],
      }],
    },
  },
  {
    files: ['apps/web-admin/src/entities/**/*.{js,ts,tsx,vue}'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [{
          group: ['@/app/**', '@/pages/**', '@/layouts/**'],
          message: '共享 entity 不得依赖页面、布局或应用装配。',
        }],
      }],
    },
  },
  {
    files: ['apps/web-admin/src/pages/**/*.{js,ts,tsx,vue}'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [{
          group: [
            '@/pages/**/model',
            '@/pages/**/model/**',
            '@/pages/**/config',
            '@/pages/**/config/**',
            '@/pages/**/ui',
            '@/pages/**/ui/**',
          ],
          message: '页面内部请使用相对路径，不得通过别名引用其他页面的内部 model/config/ui。',
        }],
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
