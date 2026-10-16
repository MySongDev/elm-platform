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
    // rpx 是小程序的响应式单位（750 设计稿基准，编译期换算），stylelint 的默认单位表
    // 只认 CSS 规范单位 → 不认识就报 error。放行它对 H5 两端是 no-op：rpx 只出现在
    // apps/uni-user，web-user / web-admin 全用 px（已 grep 核实零命中）。
    //
    // 为什么改根配置而不是给 uni-user 建独立配置：package.json 的 lint-staged 把
    // stylelint 写死成 `--config stylelint.config.mjs`，本地配置不会被读到；
    // 而 pre-commit 走 lint-staged，配置不放行就等于 uni-user 永远提交不了。
    'unit-no-unknown': [
      true,
      {
        ignoreUnits: ['rpx'],
      },
    ],
    'selector-class-pattern': null,
    'selector-id-pattern': null,
    // page / swiper / scroll-view 是小程序原生标签，不在 HTML 标签表里。
    // 只列实际用到的三个（全仓 grep 核实：page{ / swiper::-webkit-scrollbar /
    // scroll-view::-webkit-scrollbar）——刻意不预先放行 view/text/image 等，
    // 否则 H5 两端真正的选择器拼写错误也会被一起放过。用到新的再加。
    'selector-type-no-unknown': [
      true,
      {
        ignoreTypes: ['page', 'swiper', 'scroll-view'],
      },
    ],
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
    // ⚠️ 刻意不含 'at-rules'：at-rule 的位置在 CSS 里是有语义的，不是纯风格问题。
    // 强制 @media 前置会破坏移动优先的级联——例如
    // `.store-card { padding: 20rpx }` 后跟 `@media { .store-card { padding-inline: 14px } }`，
    // 一旦 @media 被搬到前面，简写 padding 反而覆盖了长写 padding-inline，小屏适配静默失效
    // （uni-user 接入时 --fix 就真造成过这个破坏，见 apps/uni-user 的 CartStoreCard.vue）。
    // @keyframes 位置确实无所谓，但同一条规则管不了两者，故整体放开。
    // 对 web-admin / web-user 是 no-op：放宽只会减少报错，不会新增（两端已实测 EXIT=0）。
    'order/order': [
      [
        'custom-properties',
        'dollar-variables',
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
    // svgtofont 生成的字体样式表。lint-staged 的 --fix 会把它的
    // `font-family: "elm-iconfont"` 改成不带引号，而 generate-iconfont.mjs 重跑
    // 又会写回带引号的版本 → 每次生成/提交来回翻烧饼。产物不参与 lint。
    'apps/uni-user/src/static/iconfont/elm-iconfont.css',
  ],
}
