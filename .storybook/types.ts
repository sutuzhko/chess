/**
 * Локальные type-shim'ы для stories, чтобы их можно было писать ДО подъёма
 * Storybook. После установки `@storybook/vue3-vite` эти типы должны быть
 * заменены на импорт `Meta`/`StoryObj` из пакета.
 */
import type { Component } from 'vue';

export interface Meta<C extends Component = Component> {
  title?: string;
  component: C;
  argTypes?: Record<string, unknown>;
  args?: Record<string, unknown>;
  parameters?: Record<string, unknown>;
  tags?: readonly string[];
  decorators?: readonly unknown[];
}

export interface StoryObj<C extends Component = Component> {
  args?: Record<string, unknown>;
  render?: (args: Record<string, unknown>) => Component | unknown;
  name?: string;
  parameters?: Record<string, unknown>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  play?: (ctx: any) => Promise<void> | void;
  _component?: C; // фантомный — даёт TS-проверку, что StoryObj привязан к компоненту
}
