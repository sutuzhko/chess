import type { Meta, StoryObj } from '../../../../../.storybook/types.js';
import BaseSelect from './BaseSelect.vue';

const meta: Meta<typeof BaseSelect> = {
  title: 'UI/BaseSelect',
  component: BaseSelect,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof BaseSelect>;

export const Default: Story = { args: {} };
