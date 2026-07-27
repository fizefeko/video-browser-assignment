import next from "eslint-config-next";
import prettier from "eslint-config-prettier";

/**
 * Flat config for the Video Browser app.
 *
 * `eslint-config-next` already registers the react, react-hooks, import,
 * jsx-a11y, @next/next and @typescript-eslint plugins, so the rules below need
 * no extra dependencies. Formatting is Prettier's job — `eslint-config-prettier`
 * comes last to switch off every stylistic rule that would conflict.
 */
const config = [
  {
    ignores: [".next/**", "out/**", "build/**", "coverage/**", "next-env.d.ts"],
  },

  ...next,

  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      // ── TypeScript ──────────────────────────────────────────────────────
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          caughtErrors: "all",
          caughtErrorsIgnorePattern: "^ignore",
          argsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/consistent-type-definitions": ["error", "interface"],
      "@typescript-eslint/explicit-function-return-type": [
        "error",
        { allowExpressions: true, allowTypedFunctionExpressions: true },
      ],
      "@typescript-eslint/naming-convention": [
        "error",
        { selector: ["enum", "enumMember"], format: ["UPPER_CASE"] },
        {
          selector: ["interface", "typeAlias", "class"],
          format: ["PascalCase"],
        },
      ],

      // ── Imports ─────────────────────────────────────────────────────────
      "import/no-default-export": "error",
      "import/order": [
        "error",
        {
          alphabetize: { order: "asc", caseInsensitive: true },
          "newlines-between": "always",
          groups: [
            "builtin",
            "external",
            "internal",
            ["parent", "sibling"],
            "index",
          ],
        },
      ],
      "no-duplicate-imports": "error",

      // ── React ───────────────────────────────────────────────────────────
      "react/function-component-definition": [
        "error",
        { namedComponents: "function-declaration" },
      ],
      "react/destructuring-assignment": ["error", "always"],
      "react/self-closing-comp": ["error", { component: true, html: true }],
      "react/jsx-boolean-value": ["error", "never"],
      "react/jsx-curly-brace-presence": "error",
      "react/jsx-fragments": ["error", "syntax"],
      "react/jsx-no-useless-fragment": "error",
      "react/jsx-pascal-case": ["error", { allowAllCaps: true }],
      "react/no-unstable-nested-components": ["error", { allowAsProps: true }],
      "react/button-has-type": "error",
      "react/boolean-prop-naming": [
        "warn",
        { rule: "^(is|has|should)[A-Z]([A-Za-z0-9]?)+" },
      ],

      // ── Accessibility (graded — 10% "best practices") ────────────────────
      "jsx-a11y/alt-text": "error",
      "jsx-a11y/anchor-has-content": "error",
      "jsx-a11y/anchor-is-valid": "error",
      "jsx-a11y/aria-props": "error",
      "jsx-a11y/heading-has-content": "error",
      "jsx-a11y/img-redundant-alt": "error",
      "jsx-a11y/label-has-associated-control": "error",
      // role="list" on a <ul> is not redundant when list markers are removed:
      // Safari/VoiceOver drop list semantics along with them, and Tailwind's
      // preflight sets list-style: none globally.
      "jsx-a11y/no-redundant-roles": ["error", { ul: ["list"] }],

      // ── General correctness ─────────────────────────────────────────────
      // warn/error stay allowed: the dataset parser reports malformed rows.
      "no-console": ["error", { allow: ["warn", "error"] }],
      "no-implicit-coercion": "error",
      "no-useless-escape": "error",
      "consistent-return": "error",
      eqeqeq: ["error", "always", { null: "ignore" }],
      "prefer-const": "error",
      "prefer-destructuring": ["error", { object: true, array: false }],
      "padding-line-between-statements": [
        "error",
        { blankLine: "always", prev: "*", next: "return" },
      ],
    },
  },

  {
    // Next.js requires default exports from these; so do config files.
    files: [
      "**/page.tsx",
      "**/layout.tsx",
      "**/template.tsx",
      "**/default.tsx",
      "**/loading.tsx",
      "**/error.tsx",
      "**/global-error.tsx",
      "**/not-found.tsx",
      "**/route.ts",
      "**/middleware.ts",
      "**/sitemap.ts",
      "**/robots.ts",
      "**/icon.tsx",
      "**/apple-icon.tsx",
      "**/opengraph-image.tsx",
      "**/*.config.{ts,mts,js,mjs}",
    ],
    rules: {
      "import/no-default-export": "off",
    },
  },

  prettier,
];

export default config;
