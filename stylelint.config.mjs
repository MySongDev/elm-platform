export default {
  extends: [
    'stylelint-config-standard-scss',
    'stylelint-config-recommended-vue/scss',
    'stylelint-config-recess-order',
  ],
  plugins: [
    'stylelint-scss',
    'stylelint-order',
  ],
  overrides: [
    {
      files: ['**/*.vue'],
      customSyntax: 'postcss-html',
    },
    {
      files: ['**/*.scss'],
      customSyntax: 'postcss-scss',
    },
  ],
  rules: {
    'font-family-no-missing-generic-family-keyword': null,
    'no-descending-specificity': null,
    'no-empty-source': null,
    'selector-class-pattern': null,
    'selector-id-pattern': null,
    'scss/at-import-partial-extension': null,
    'scss/at-mixin-pattern': null,
    'selector-pseudo-class-no-unknown': [
      true,
      {
        ignorePseudoClasses: ['deep', 'global', 'slotted'],
      },
    ],
    'selector-pseudo-element-no-unknown': [
      true,
      {
        ignorePseudoElements: ['v-deep', 'v-global', 'v-slotted'],
      },
    ],
    'keyframes-name-pattern': null,
    'order/order': [
      [
        'custom-properties',
        'dollar-variables',
        'at-rules',
        'declarations',
        'rules',
      ],
    ],
  },
  ignoreFiles: [
    'dist/**',
    'node_modules/**',
    'apps/**/dist/**',
    'apps/**/node_modules/**',
    '**/*.ts',
    '**/*.js',
  ],
}
