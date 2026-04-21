import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import nodePlugin from "eslint-plugin-n";

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  nodePlugin.configs["flat/recommended"],
  {
    files: ["src/**/*.ts", "tests/**/*.ts"],
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.eslint.json",
        tsconfigRootDir: import.meta.dirname,
      },
    },
    settings: {
      node: {
        allowModules: ["mysql2", "open"],
        tryExtensions: [".js", ".ts"],
      },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "n/no-unsupported-features/es-syntax": "off",
      "n/no-unsupported-features/node-builtins": "off",
      "n/no-missing-import": "off",
      "n/no-process-exit": "off",
      "n/hashbang": "off",
    },
  },
  {
    ignores: ["dist/**", "node_modules/**", "src/public/**"],
  },
);
