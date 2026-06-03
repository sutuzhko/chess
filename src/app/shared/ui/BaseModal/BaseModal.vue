<template>
  <Teleport to="body">
    <Transition name="base-modal">
      <div
        v-if="open"
        class="base-modal__backdrop"
        @click.self="onBackdropClick"
        @keydown.esc="onEscape"
      >
        <div
          ref="dialogEl"
          class="base-modal__dialog"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="title || $slots.title ? titleId : undefined"
          tabindex="-1"
          @keydown="onTrapKey"
        >
          <header
            v-if="$slots.title || title || eyebrow"
            class="base-modal__hero"
          >
            <p
              v-if="eyebrow"
              class="base-modal__eyebrow"
            >
              {{ eyebrow }}
            </p>
            <h2
              :id="titleId"
              class="base-modal__title"
            >
              <slot name="title">
                {{ title }}
              </slot>
            </h2>
            <p
              v-if="$slots.subtitle"
              class="base-modal__sub"
            >
              <slot name="subtitle" />
            </p>
          </header>

          <div class="base-modal__body">
            <slot />
          </div>

          <footer
            v-if="$slots.actions"
            class="base-modal__footer"
          >
            <slot name="actions" />
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, useId, watch } from 'vue';

const props = withDefaults(defineProps<{
  open: boolean;
  title?: string;
  eyebrow?: string;
  closeOnBackdrop?: boolean;
  closeOnEsc?: boolean;
}>(), {
  title: '',
  eyebrow: '',
  closeOnBackdrop: true,
  closeOnEsc: true,
});

const emit = defineEmits<{
  'update:open': [value: boolean];
  close: [];
}>();

const titleId = useId();
const dialogEl = ref<HTMLElement | null>(null);
let lastFocused: HTMLElement | null = null;

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function focusableElements(): HTMLElement[] {
  if (!dialogEl.value) return [];
  return Array.from(dialogEl.value.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
    .filter((el) => el.offsetParent !== null || el === document.activeElement);
}

watch(() => props.open, async (open) => {
  if (open) {
    lastFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    await nextTick();
    const focusables = focusableElements();
    // Фокус на первый интерактивный элемент, если есть; иначе — на сам диалог.
    (focusables[0] ?? dialogEl.value)?.focus();
    document.addEventListener('keydown', onKeydown);
  } else {
    document.removeEventListener('keydown', onKeydown);
    lastFocused?.focus();
    lastFocused = null;
  }
});

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown);
});

function onKeydown(e: KeyboardEvent): void {
  if (e.key === 'Escape' && props.closeOnEsc) close();
}

// Focus-trap: Tab/Shift+Tab циклит внутри диалога.
function onTrapKey(e: KeyboardEvent): void {
  if (e.key !== 'Tab') return;
  const focusables = focusableElements();
  if (focusables.length === 0) {
    e.preventDefault();
    dialogEl.value?.focus();
    return;
  }
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  if (!first || !last) return;
  const active = document.activeElement as HTMLElement | null;

  if (e.shiftKey) {
    if (active === first || active === dialogEl.value) {
      e.preventDefault();
      last.focus();
    }
  } else {
    if (active === last) {
      e.preventDefault();
      first.focus();
    }
  }
}

function onBackdropClick(): void {
  if (props.closeOnBackdrop) close();
}

function onEscape(): void {
  if (props.closeOnEsc) close();
}

function close(): void {
  emit('update:open', false);
  emit('close');
}
</script>

<style scoped lang="scss">
.base-modal__backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--sp-5);
  background: var(--overlay);
  backdrop-filter: blur(3px);
}

.base-modal__dialog {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-xl);
  box-shadow: var(--shadow-xl);
  max-width: min(560px, 100%);
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  outline: none;
  overflow: hidden;
}

.base-modal__hero {
  padding: var(--sp-5) var(--sp-5) var(--sp-3);
  display: flex;
  flex-direction: column;
  gap: var(--sp-1);
  border-bottom: 1px solid var(--divider);
}

.base-modal__eyebrow {
  font-family: var(--font-mono);
  font-size: var(--fs-2xs);
  letter-spacing: var(--tracking-wider);
  text-transform: uppercase;
  color: var(--text-faint);
  margin: 0;
  font-weight: 500;
}

.base-modal__title {
  margin: 0;
  font-size: var(--fs-lg);
  font-weight: 600;
  letter-spacing: var(--tracking-tight);
  color: var(--text-strong);
}

.base-modal__sub {
  margin: 0;
  color: var(--text-muted);
  font-size: var(--fs-sm);
}

.base-modal__body {
  padding: var(--sp-5);
  overflow: auto;
}

.base-modal__footer {
  padding: var(--sp-3) var(--sp-5) var(--sp-5);
  display: flex;
  justify-content: flex-end;
  gap: var(--sp-2);
  border-top: 1px solid var(--divider);
}

.base-modal-enter-active,
.base-modal-leave-active {
  transition: opacity var(--dur-base) var(--ease-out);

  .base-modal__dialog {
    transition: transform var(--dur-base) var(--ease-out);
  }
}

.base-modal-enter-from,
.base-modal-leave-to {
  opacity: 0;

  .base-modal__dialog {
    transform: scale(0.96);
  }
}
</style>
