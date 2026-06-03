// @vitest-environment happy-dom
import BaseBadge from '@/app/shared/ui/BaseBadge/BaseBadge.vue';
import BaseButton from '@/app/shared/ui/BaseButton/BaseButton.vue';
import BaseCard from '@/app/shared/ui/BaseCard/BaseCard.vue';
import BaseChip from '@/app/shared/ui/BaseChip/BaseChip.vue';
import BaseInput from '@/app/shared/ui/BaseInput/BaseInput.vue';
import BaseModal from '@/app/shared/ui/BaseModal/BaseModal.vue';
import BaseSelect from '@/app/shared/ui/BaseSelect/BaseSelect.vue';
import BaseSwitch from '@/app/shared/ui/BaseSwitch/BaseSwitch.vue';
import BaseTabPanel from '@/app/shared/ui/BaseTabPanel/BaseTabPanel.vue';
import BaseTabs from '@/app/shared/ui/BaseTabs/BaseTabs.vue';
import EmptyState from '@/app/shared/ui/EmptyState/EmptyState.vue';
import IconBase from '@/app/shared/ui/IconBase/IconBase.vue';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { h, nextTick } from 'vue';

describe('BaseButton', () => {
  it('применяет классы variant + size', () => {
    const w = mount(BaseButton, { props: { variant: 'primary', size: 'lg' }, slots: { default: 'Go' } });
    expect(w.classes()).toContain('base-btn');
    expect(w.classes()).toContain('base-btn--primary');
    expect(w.classes()).toContain('base-btn--lg');
    expect(w.text()).toBe('Go');
  });

  it('эмитит click когда не disabled', async () => {
    const w = mount(BaseButton);
    await w.trigger('click');
    expect(w.emitted('click')).toHaveLength(1);
  });

  it('подавляет click при loading', async () => {
    const w = mount(BaseButton, { props: { loading: true } });
    await w.trigger('click');
    expect(w.emitted('click')).toBeUndefined();
    expect(w.attributes('aria-busy')).toBe('true');
  });
});

describe('BaseCard', () => {
  it('рендерит title slot и footer', () => {
    const w = mount(BaseCard, {
      props: { title: 'Stats' },
      slots: { default: 'body', footer: 'foot' },
    });
    expect(w.classes()).toContain('base-card');
    expect(w.find('.base-card__title').text()).toBe('Stats');
    expect(w.find('.base-card__footer').text()).toBe('foot');
  });

  it('эмитит click при interactive', async () => {
    const w = mount(BaseCard, { props: { interactive: true } });
    await w.trigger('click');
    expect(w.emitted('click')).toHaveLength(1);
    expect(w.classes()).toContain('base-card--interactive');
  });
});

describe('BaseModal', () => {
  it('рендерит title и эмитит update:open по клику на backdrop', async () => {
    const w = mount(BaseModal, {
      props: { open: true, title: 'Hi' },
      attachTo: document.body,
    });
    await nextTick();
    expect(document.body.querySelector('.base-modal__title')?.textContent).toBe('Hi');
    const backdrop = document.body.querySelector<HTMLElement>('.base-modal__backdrop');
    backdrop?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await nextTick();
    expect(w.emitted('update:open')?.[0]).toEqual([false]);
    w.unmount();
  });

  it('выставляет role=dialog и aria-modal', async () => {
    const w = mount(BaseModal, {
      props: { open: true, title: 'A11y' },
      attachTo: document.body,
    });
    await nextTick();
    const dialog = document.body.querySelector<HTMLElement>('.base-modal__dialog');
    expect(dialog?.getAttribute('role')).toBe('dialog');
    expect(dialog?.getAttribute('aria-modal')).toBe('true');
    w.unmount();
  });
});

describe('BaseTabs + BaseTabPanel', () => {
  it('эмитит update:modelValue по клику и переключает видимость панели', async () => {
    const tabs = [
      { key: 'a', label: 'A' },
      { key: 'b', label: 'B', count: 3 },
    ] as const;
    const w = mount(BaseTabs, { props: { modelValue: 'a', tabs } });
    const items = w.findAll('.base-tabs__item');
    await items[1]?.trigger('click');
    expect(w.emitted('update:modelValue')?.[0]).toEqual(['b']);
    expect(w.find('.base-tabs__count').text()).toBe('3');
  });

  it('панель скрыта при несовпадении ключа', () => {
    const w = mount(BaseTabPanel, {
      props: { panelKey: 'a', modelValue: 'b' },
      slots: { default: 'content' },
    });
    const el = w.element as HTMLElement;
    expect(el.style.display).toBe('none');
  });
});

describe('BaseBadge', () => {
  it('применяет модификатор tone', () => {
    const w = mount(BaseBadge, { props: { tone: 'success' }, slots: { default: 'OK' } });
    expect(w.classes()).toContain('base-badge');
    expect(w.classes()).toContain('base-badge--success');
  });
});

describe('BaseChip', () => {
  it('переключает active и эмитит click', async () => {
    const w = mount(BaseChip, { props: { active: true } });
    expect(w.classes()).toContain('is-active');
    expect(w.attributes('aria-pressed')).toBe('true');
    await w.trigger('click');
    expect(w.emitted('click')).toHaveLength(1);
  });
});

describe('BaseInput', () => {
  it('эмитит update:modelValue на input', async () => {
    const w = mount(BaseInput, { props: { modelValue: '', label: 'Name' } });
    expect(w.find('.base-field__label').text()).toBe('Name');
    const input = w.find('input');
    await input.setValue('Bob');
    expect(w.emitted('update:modelValue')?.[0]).toEqual(['Bob']);
  });
});

describe('BaseSelect', () => {
  it('рендерит options и эмитит update:modelValue', async () => {
    const w = mount(BaseSelect, {
      props: {
        modelValue: 'a',
        options: [
          { value: 'a', label: 'Alpha' },
          { value: 'b', label: 'Beta' },
        ],
      },
    });
    expect(w.findAll('option')).toHaveLength(2);
    await w.find('select').setValue('b');
    expect(w.emitted('update:modelValue')?.[0]).toEqual(['b']);
  });
});

describe('BaseSwitch', () => {
  it('эмитит boolean toggle', async () => {
    const w = mount(BaseSwitch, { props: { modelValue: false, label: 'Sound' } });
    await w.find('input').setValue(true);
    expect(w.emitted('update:modelValue')?.[0]).toEqual([true]);
    expect(w.find('.base-switch__label').text()).toContain('Sound');
  });
});

describe('EmptyState', () => {
  it('рендерит title, description, slots', () => {
    const w = mount(EmptyState, {
      props: { title: 'Nothing here', description: 'Try later' },
      slots: { actions: () => h('button', 'Retry') },
    });
    expect(w.find('.empty-state__title').text()).toBe('Nothing here');
    expect(w.find('.empty-state__desc').text()).toBe('Try later');
    expect(w.find('.empty-state__actions button').text()).toBe('Retry');
  });
});

describe('IconBase', () => {
  it('пробрасывает size как CSS-переменную', () => {
    const w = mount(IconBase, { props: { size: 28 }, slots: { default: '<svg/>' } });
    expect(w.attributes('style')).toContain('--icon-base-size: 28px');
  });
});
