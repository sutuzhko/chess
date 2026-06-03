/**
 * Storybook конфигурация — staged, не активирована.
 *
 * Чтобы поднять Storybook:
 *   npm i -D @storybook/vue3-vite @storybook/test storybook
 *   npm run storybook
 *
 * Stories живут рядом с компонентами: `src/app/shared/ui/<X>/<X>.stories.ts`.
 * Формат — CSF3 (`Meta<typeof Component>`).
 */
import type { StorybookConfig } from '@storybook/vue3-vite';

const config: StorybookConfig = {
  stories: ['../src/app/**/*.stories.@(ts|tsx)'],
  addons: [],
  framework: {
    name: '@storybook/vue3-vite',
    options: {},
  },
  core: {
    disableTelemetry: true,
  },
  typescript: {
    check: false,
  },
};

export default config;
