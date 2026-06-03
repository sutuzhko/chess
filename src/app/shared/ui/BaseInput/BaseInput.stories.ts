import type { Meta, StoryObj } from '../../../../../.storybook/types.js';
import BaseInput from './BaseInput.vue';

const meta: Meta<typeof BaseInput> = {
  title: 'UI/BaseInput',
  component: BaseInput,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof BaseInput>;

export const Default: Story = { args: {} };
