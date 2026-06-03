/**
 * Storybook preview — глобальные декораторы и параметры.
 *
 * Подключает design-токены и Pinia для всех stories.
 */
import { createPinia } from 'pinia';
import { setup } from '@storybook/vue3-vite';
import type { Preview } from '@storybook/vue3-vite';
import '../src/app/assets/tokens.scss';
import '../src/app/assets/app.scss';

setup((app) => {
  app.use(createPinia());
});

const preview: Preview = {
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'app-bg',
      values: [
        { name: 'app-bg', value: 'var(--bg)' },
        { name: 'surface', value: 'var(--surface)' },
        { name: 'sunk', value: 'var(--surface-sunk)' },
      ],
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  globalTypes: {
    theme: {
      description: 'App theme',
      defaultValue: 'light',
      toolbar: {
        title: 'Theme',
        icon: 'paintbrush',
        items: [
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' },
        ],
        dynamicTitle: true,
      },
    },
  },
};

export default preview;
