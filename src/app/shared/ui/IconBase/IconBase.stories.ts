import type { Meta, StoryObj } from '../../../../../.storybook/types.js';
import IconBase from './IconBase.vue';

const meta: Meta<typeof IconBase> = {
  title: 'UI/IconBase',
  component: IconBase,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof IconBase>;

export const Default: Story = { args: {} };
