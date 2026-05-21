import antfu from '@antfu/eslint-config'

export default antfu({
  vue: true,
  typescript: true,
  rules: {
    'no-console': 'off',
    'no-undef': 'off',
    'e18e/prefer-static-regex': 'off',
    'style/max-statements-per-line': 'off',
    'style/no-mixed-operators': 'off',
    'unused-imports/no-unused-vars': ['warn', {
      args: 'after-used',
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
    }],
    'ts/no-empty-object-type': 'off',
    'complexity': ['warn', 8],
    'max-depth': ['warn', 3],
    // 'max-lines-per-function': ['warn', {
    //   max: 60,
    //   skipBlankLines: true,
    //   skipComments: true,
    // }],
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
    '@typescript-eslint/no-explicit-any': 'warn',
    'vue/custom-event-name-casing': 'off',
    'vue/no-template-shadow': 'off',
    'vue/html-indent': 'off',
    'vue/html-closing-bracket-newline': 'off',
    'vue/first-attribute-linebreak': 'off',
  },
})
