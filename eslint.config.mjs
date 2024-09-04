import js from "@eslint/js";
import globals from "globals";

export default [
  js.configs.recommended,
  {
    ignores: ["cypress/*","screens/*","cypress.config.js"],
  },
    {
        files:["**/*.js"],
        rules: {
            "no-unused-vars": "warn",
            "use-isnan":"warn"
        },
        languageOptions: {
          globals: {
            ...globals.browser,
            ...globals.node,
            google: "readonly"
          },
        }
    },
];