import type { Meta, StoryObj } from '../../../../../.storybook/types.js';
import EmptyState from './EmptyState.vue';

const meta: Meta<typeof EmptyState> = {
  title: 'UI/EmptyState',
  component: EmptyState,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof EmptyState>;

export const Default: Story = { args: {} };
