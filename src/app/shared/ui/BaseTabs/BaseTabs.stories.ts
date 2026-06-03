import type { Meta, StoryObj } from '../../../../../.storybook/types.js';
import BaseTabs from './BaseTabs.vue';

const meta: Meta<typeof BaseTabs> = {
  title: 'UI/BaseTabs',
  component: BaseTabs,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof BaseTabs>;

export const Default: Story = { args: {} };
