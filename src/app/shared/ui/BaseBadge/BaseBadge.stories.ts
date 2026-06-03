import type { Meta, StoryObj } from '../../../../../.storybook/types.js';
import BaseBadge from './BaseBadge.vue';

const meta: Meta<typeof BaseBadge> = {
  title: 'UI/BaseBadge',
  component: BaseBadge,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof BaseBadge>;

export const Default: Story = { args: {} };
