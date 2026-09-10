import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";

export default defineConfig([
  globalIgnores([
    "mcp-server/**",
    // projex-app's main branch is still the Next app, so a stale .next/ build
    // cache can be sitting here; without this, eslint lints all of it.
    ".next/**",
    ".output/**",
    ".nitro/**",
    "dist/**",
    "src/routeTree.gen.ts",
  ]),
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    plugins: { "react-hooks": reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
]);
