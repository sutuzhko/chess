import type { Meta, StoryObj } from '../../../../../.storybook/types.js';
import BaseTabPanel from './BaseTabPanel.vue';

const meta: Meta<typeof BaseTabPanel> = {
  title: 'UI/BaseTabPanel',
  component: BaseTabPanel,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof BaseTabPanel>;

export const Default: Story = { args: {} };
