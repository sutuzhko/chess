import type { Meta, StoryObj } from '../../../../../.storybook/types.js';
import BaseModal from './BaseModal.vue';

const meta: Meta<typeof BaseModal> = {
  title: 'UI/BaseModal',
  component: BaseModal,
  tags: ['autodocs'],
  argTypes: {
    open: { control: 'boolean' },
    closeOnBackdrop: { control: 'boolean' },
    closeOnEsc: { control: 'boolean' },
  },
};
export default meta;

type Story = StoryObj<typeof BaseModal>;

export const Default: Story = {
  args: {
    open: true,
    title: 'Подтверждение',
    eyebrow: 'Действие',
    closeOnBackdrop: true,
    closeOnEsc: true,
  },
};

export const WithoutEyebrow: Story = {
  args: { open: true, title: 'Простой диалог' },
};
