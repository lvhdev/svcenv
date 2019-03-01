module.exports = {
    "root": true,
    "env": {
        "node": true,
        "commonjs": true,
        "es6": true,
        "jquery": false,
        "jest": true,
        "jasmine": true
    },
    "extends": "eslint:recommended",
    "parserOptions": {
        "sourceType": "module",
        "ecmaVersion" : 2018
    },
    "rules": {
        "brace-style" : [
          "error",
          "stroustrup",
          { "allowSingleLine": true }
        ],
        "comma-spacing" : [
          "error",
          { "after": true }
        ],
        "curly" : [
          "error"
        ],
        "indent": [
            "error",
            2
        ],
        "linebreak-style": [
            "error",
            "unix"
        ],
        "max-len": [
            "error",
            100
        ],
        "no-console": [
          "warn"
        ],
        "no-mixed-spaces-and-tabs": [
          "error"
        ],
        "no-trailing-spaces" : [
          "error"
        ],
        "no-unused-vars": [
          "error"
        ],
        "no-var": [
          "error"
        ],
        "quotes": [
          "error",
          "single"
        ],
        "semi": [
          "error",
          "always"
        ],
        "prefer-const": [
          "error",
          {
            "destructuring": "any",
            "ignoreReadBeforeAssign": false
          }
      ],
    }
};
