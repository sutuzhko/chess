<template>
  <component
    :is="tag"
    :class="classes"
    @click="onClick"
  >
    <header
      v-if="$slots.header || title"
      class="base-card__header"
    >
      <slot name="header">
        <span class="base-card__title">{{ title }}</span>
      </slot>
      <slot name="header-actions" />
    </header>

    <div :class="bodyClass">
      <slot />
    </div>

    <footer
      v-if="$slots.footer"
      class="base-card__footer"
    >
      <slot name="footer" />
    </footer>
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue';

type Tone = 'default' | 'sunk' | 'ghost' | 'brand';
type Padding = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type Elevation = 'flat' | 'raised' | 'floating';

const props = withDefaults(defineProps<{
  tag?: 'section' | 'article' | 'div' | 'a';
  tone?: Tone;
  padding?: Padding;
  elevation?: Elevation;
  interactive?: boolean;
  title?: string;
}>(), {
  tag: 'section',
  tone: 'default',
  padding: 'md',
  elevation: 'flat',
  interactive: false,
  title: '',
});

const emit = defineEmits<{ click: [event: MouseEvent] }>();

const classes = computed<string[]>(() => {
  const list = ['base-card', `base-card--${props.tone}`, `base-card--pad-${props.padding}`, `base-card--${props.elevation}`];
  if (props.interactive) list.push('base-card--interactive');
  return list;
});

const bodyClass = 'base-card__body';

function onClick(event: MouseEvent): void {
  emit('click', event);
}
</script>

<style scoped lang="scss">
.base-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  position: relative;
}

.base-card--sunk {
  background: var(--surface-2);
  border-color: var(--border-subtle);
}

.base-card--ghost {
  background: transparent;
}

.base-card--brand {
  background: var(--accent);
  color: var(--accent-fg);
  border-color: var(--accent);
}

.base-card--flat {
  box-shadow: none;
}

.base-card--raised {
  box-shadow: var(--shadow-sm);
}

.base-card--floating {
  box-shadow: var(--shadow-md);
}

.base-card--interactive {
  cursor: pointer;
  transition:
    border-color var(--dur-base) var(--ease-out),
    background var(--dur-base) var(--ease-out),
    transform var(--dur-fast) var(--ease-out),
    box-shadow var(--dur-base) var(--ease-out);
}

.base-card--interactive:hover {
  border-color: var(--border-strong);
  background: var(--surface-hover);
}

.base-card--interactive:active {
  transform: translateY(0.5px);
}

/* Padding scale */
.base-card--pad-none { padding: 0; }
.base-card--pad-xs { padding: var(--sp-2); }
.base-card--pad-sm { padding: var(--sp-3); }
.base-card--pad-md { padding: var(--sp-4); }
.base-card--pad-lg { padding: var(--sp-5); }
.base-card--pad-xl { padding: var(--sp-6); }

.base-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-3);
  padding: var(--sp-3);
  border-bottom: 1px solid var(--divider);
  font-weight: 600;
  font-size: var(--fs-base);
  color: var(--text);
  margin: 0;
}

.base-card__title {
  font-weight: 600;
  font-size: var(--fs-base);
  color: var(--text);
  margin: 0;
}

.base-card__body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.base-card__footer {
  padding: var(--sp-3) var(--sp-2);
  margin-top: var(--sp-3);
  border-top: 1px solid var(--divider);
  display: flex;
  justify-content: flex-end;
  gap: var(--sp-2);
}
</style>
