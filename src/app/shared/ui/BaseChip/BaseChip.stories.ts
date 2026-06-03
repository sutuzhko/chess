import type { Meta, StoryObj } from '../../../../../.storybook/types.js';
import BaseChip from './BaseChip.vue';

const meta: Meta<typeof BaseChip> = {
  title: 'UI/BaseChip',
  component: BaseChip,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof BaseChip>;

export const Default: Story = { args: {} };
