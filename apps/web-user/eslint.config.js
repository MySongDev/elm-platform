import antfu from '@antfu/eslint-config'

export default antfu({
  vue: true,
  rules: {
    'no-console': 'off',
    'vue/html-indent': 'off',
    'vue/custom-event-name-casing': 'off',
    'e18e/prefer-static-regex': 'off',
    'vue/no-template-shadow': 'off',
    'vue/html-closing-bracket-newline': 'off',
    'vue/first-attribute-linebreak': 'off',
  },
})
