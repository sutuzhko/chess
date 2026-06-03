import type { Meta, StoryObj } from '../../../../../.storybook/types.js';
import BaseSwitch from './BaseSwitch.vue';

const meta: Meta<typeof BaseSwitch> = {
  title: 'UI/BaseSwitch',
  component: BaseSwitch,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof BaseSwitch>;

export const Default: Story = { args: {} };
