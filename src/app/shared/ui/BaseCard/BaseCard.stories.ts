import type { Meta, StoryObj } from '../../../../../.storybook/types.js';
import BaseCard from './BaseCard.vue';

const meta: Meta<typeof BaseCard> = {
  title: 'UI/BaseCard',
  component: BaseCard,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof BaseCard>;

export const Default: Story = {
  args: { title: 'Карточка', interactive: false },
};

export const Interactive: Story = {
  args: { title: 'Интерактивная карточка', interactive: true },
};
