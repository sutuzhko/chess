import js from '@eslint/js';
import pluginVue from 'eslint-plugin-vue';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'coverage/**',
      // Storybook staged but not active — stories файлы вне tsconfig.
      '**/*.stories.ts',
      '.storybook/**',
    ],
  },

  js.configs.recommended,

  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,

  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2022,
      },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    // TypeScript already catches undefined references — no-undef causes false positives
    rules: {
      'no-undef': 'off',
    },
  },

  ...pluginVue.configs['flat/recommended'],

  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
        extraFileExtensions: ['.vue'],
      },
    },
  },

  // Strict rules for UI layer (app shell, modules, shared)
  {
    files: [
      'src/app/**/*.{ts,vue}',
      'src/modules/**/*.{ts,vue}',
      'src/shared/**/*.{ts,vue}',
    ],
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/explicit-function-return-type': ['error', { allowExpressions: true }],
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-non-null-assertion': 'error',
      // Numbers in template literals are always safe
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
      // Static-only classes are a valid DDD pattern for grouping domain logic
      '@typescript-eslint/no-extraneous-class': 'off',

      'vue/component-api-style': ['error', ['script-setup']],
      'vue/define-macros-order': ['error', { order: ['defineProps', 'defineEmits'] }],
      // UI-kit primitives intentionally use short single-word names matching v3 design tokens.
      'vue/multi-word-component-names': 'off',
      'vue/no-unused-vars': 'error',
      'vue/block-lang': ['error', { script: { lang: 'ts' } }],
      // v-html is intentionally used for chess notation rendering
      'vue/no-v-html': 'warn',
    },
  },

  // Architectural boundaries: src/app/ may not reach into domain or engine internals at runtime.
  // Vue shell talks to the game module only via application use-cases / ports.
  // Type-only imports from domain are allowed — TS types are erased and add no runtime coupling.
  {
    files: ['src/app/**/*.{ts,vue}'],
    rules: {
      // Архитектурные границы enforced: composition root в main.ts —
      // единственное место, где Vue-слой видит infrastructure/engine.
      // Остальные нарушения этой границы блокируют коммит.
      'no-restricted-imports': 'off',
      '@typescript-eslint/no-restricted-imports': ['error', {
        patterns: [
          {
            group: [
              '**/modules/game/domain/**',
              '@/modules/game/domain/**',
              '@modules/game/domain/**',
            ],
            message: 'src/app/ must not import domain values at runtime. Use application use-cases / DTOs. Type-only imports are allowed.',
            allowTypeImports: true,
          },
          {
            group: [
              '**/modules/game/infrastructure/engine/**',
              '@/modules/game/infrastructure/engine/**',
              '@modules/game/infrastructure/engine/**',
            ],
            message: 'src/app/ must not import engine adapters. Inject through an application port.',
            allowTypeImports: true,
          },
        ],
      }],
    },
  },

  // Relaxed rules for engine (domain layer) — low-level chess engine code
  {
    files: ['src/engine/**/*.ts'],
    rules: {
      '@typescript-eslint/no-deprecated': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-extraneous-class': 'off',
      '@typescript-eslint/restrict-plus-operands': 'off',
      '@typescript-eslint/no-inferrable-types': 'off',
      '@typescript-eslint/no-unnecessary-condition': 'off',
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
      '@typescript-eslint/consistent-type-imports': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },

  // Test files
  {
    files: ['tests/**/*.ts'],
    rules: {
      // Vitest's expect(spy).toHaveBeenCalledWith() triggers this rule as false positive
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },

  // Suppress deprecation warning on this config file itself
  {
    files: ['eslint.config.ts'],
    rules: {
      '@typescript-eslint/no-deprecated': 'off',
    },
  },
)
