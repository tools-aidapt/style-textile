import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  // .claude holds vendored design-system files; src/aidapt holds its tokens
  {
    // dist is output; .claude and src/aidapt are vendored design-system files;
    // n8n/*.js are Code-node snippets that run inside n8n's own wrapper, where
    // a top-level return is the contract rather than a syntax error
    ignores: ["dist", ".claude", "src/aidapt", "coverage", "n8n"],
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      // TypeScript's noUnusedLocals catches these too, but only on a full build;
      // the lint run is what CI gates on, so it should say the same thing
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  {
    // shadcn/ui is vendored, and its multi-export files are the library's own
    // shape rather than a choice this project made
    files: ["src/components/ui/**"],
    rules: { "react-refresh/only-export-components": "off" },
  },
  {
    files: ["**/*.test.{ts,tsx}", "src/test/**"],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },
);
