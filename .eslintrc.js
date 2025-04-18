// https://eslint.org/docs/user-guide/configuring
/* eslint-disable */

module.exports = {
  root: true,
  parserOptions: {
    parser: 'babel-eslint'
  },
  env: {
    browser: true,
  },
  extends: [
    // https://github.com/vuejs/eslint-plugin-vue#priority-a-essential-error-prevention
    // consider switching to `plugin:vue/strongly-recommended` or `plugin:vue/recommended` for stricter rules.
    'plugin:vue/essential', 
    // https://github.com/standard/standard/blob/master/docs/RULES-en.md
    'standard'
  ],
  // required to lint *.vue files
  plugins: [
    'vue'
  ],
  // add your custom rules here
  rules: {
    'generator-star-spacing': 'off',
    'no-debugger': 'off',
    'comma-dangle': 'off',
    'eol-last': 'off',
    'no-trailing-spaces': 'off',
    'indent': 'off',
    'semi': 'off',  
    'space-before-function-paren': 'off',
    'quotes': 'off',
    "space-infix-ops": "off"
  }
  
}
