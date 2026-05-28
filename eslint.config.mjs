import globals from "globals";
import js from "@eslint/js";
import tseslint from "typescript-eslint";

const commonGlobals = {
  ...globals.es2021,
  ...globals.node,
  wx: "readonly",
};

const miniProgramGlobals = {
  ...commonGlobals,
  App: "readonly",
  Component: "readonly",
  Page: "readonly",
  getApp: "readonly",
  getCurrentPages: "readonly",
};

export default [
  {
    ignores: [
      "node_modules/**",
      "cloudfunctions/rescueApi/node_modules/**",
      "dist/**",
      ".tmp/**",
      ".qa-output/**",
      ".swc/**",
    ],
  },
  {
    files: ["**/*.{js,mjs,cjs}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "commonjs",
      globals: commonGlobals,
    },
    rules: {
      ...js.configs.recommended.rules,
      "no-console": "off",
      "no-constant-condition": ["error", { "checkLoops": false }],
      "no-unused-vars": [
        "error",
        {
          "argsIgnorePattern": "^_",
          "caughtErrorsIgnorePattern": "^_",
          "ignoreRestSiblings": true,
          "varsIgnorePattern": "^_"
        }
      ],
    },
  },
  {
    files: ["scripts/**/*.mjs"],
    languageOptions: {
      sourceType: "module",
    },
  },
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        ecmaVersion: "latest",
        sourceType: "module",
      },
      globals: {
        ...miniProgramGlobals,
        ...globals.browser,
      },
    },
    plugins: {
      "@typescript-eslint": tseslint.plugin,
    },
    rules: {
      "no-console": "off",
      "no-debugger": "error",
      "no-unused-vars": "off",
      "no-undef": "off",
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
];
