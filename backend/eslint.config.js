import prettier from "eslint-config-prettier";

export default [
  {
    ignores: ["node_modules/**", "data/**"],
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
    },
    linterOptions: {
      reportUnusedDisableDirectives: true,
    },
    rules: {
      "no-unused-vars": "warn",
      "no-console": "off",
      quotes: ["error", "double"],
      semi: ["error", "always"],
      indent: ["error", 2],
    },
  },
  prettier, // <- Ez kikapcsol minden format-related szabályt
];
