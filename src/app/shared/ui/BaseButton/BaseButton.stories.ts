import type { Meta, StoryObj } from '../../../../../.storybook/types.js';
import BaseButton from './BaseButton.vue';

const meta: Meta<typeof BaseButton> = {
  title: 'UI/BaseButton',
  component: BaseButton,
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['primary', 'secondary', 'tertiary', 'ghost', 'danger'] },
    size: { control: 'select', options: ['xs', 'sm', 'md', 'lg', 'xl'] },
    disabled: { control: 'boolean' },
    loading: { control: 'boolean' },
    block: { control: 'boolean' },
  },
};
export default meta;

type Story = StoryObj<typeof BaseButton>;

export const Primary: Story = {
  args: { variant: 'primary', size: 'md', label: 'Сохранить' },
};

export const Secondary: Story = {
  args: { variant: 'secondary', size: 'md', label: 'Отменить' },
};

export const Ghost: Story = {
  args: { variant: 'ghost', size: 'md', label: 'Подробнее' },
};

export const Danger: Story = {
  args: { variant: 'danger', size: 'md', label: 'Удалить' },
};

export const Loading: Story = {
  args: { variant: 'primary', size: 'md', label: 'Сохранение…', loading: true },
};

export const Disabled: Story = {
  args: { variant: 'primary', size: 'md', label: 'Недоступно', disabled: true },
};

export const Block: Story = {
  args: { variant: 'primary', size: 'lg', label: 'На всю ширину', block: true },
};
