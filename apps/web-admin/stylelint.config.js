export default {
  extends: [
    'stylelint-config-standard-scss',
    'stylelint-config-html/vue',
    'stylelint-config-recess-order',
  ],
  plugins: [
    'stylelint-scss',
    'stylelint-order',
    'stylelint-declaration-strict-value',
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
    'selector-class-pattern': [
      '^[a-z][a-z0-9]*(?:-[a-z0-9]+)*(?:__[a-z0-9-]+)?(?:--[a-z0-9-]+)?$',
      {
        message: '类名请使用 kebab-case 或 BEM，例如 user-table__toolbar',
        severity: 'warning',
      },
    ],
    'declaration-property-value-disallowed-list': [
      {
        '/^color$/': ['/^#/', '/rgb\\(/'],
        '/^background(?:-color)?$/': ['/^#/', '/rgb\\(/'],
        '/^border(?:-color)?$/': ['/^#/', '/rgb\\(/'],
      },
      {
        severity: 'warning',
      },
    ],
    'scale-unlimited/declaration-strict-value': [
      ['/color/', 'fill', 'stroke', 'background-color', 'border-color'],
      {
        ignoreValues: ['currentColor', 'transparent', 'inherit'],
        message: '颜色必须使用 CSS token，例如 var(--app-text-primary)',
        severity: 'warning',
      },
    ],
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
    'selector-max-compound-selectors': [4, { severity: 'warning' }],
    'selector-max-specificity': ['0,4,0', { severity: 'warning' }],
    'declaration-no-important': [true, { severity: 'warning' }],
    'keyframes-name-pattern': null,
    'no-duplicate-selectors': [true, { severity: 'warning' }],
    'scss/dollar-variable-pattern': ['^app-[a-z0-9-]+$', { severity: 'warning' }],
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
  ignoreFiles: ['dist/**', 'node_modules/**', '**/*.ts', '**/*.js'],
}
