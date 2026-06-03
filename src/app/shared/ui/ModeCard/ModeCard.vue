<template>
  <component
    :is="tag"
    class="mode-card"
    :class="[
      `mode-card--${size}`,
      {
        'mode-card--brand': brand,
        'mode-card--disabled': disabled || !!soonLabel,
      },
    ]"
    :disabled="tag === 'button' ? (disabled || !!soonLabel) : undefined"
    :type="tag === 'button' ? 'button' : undefined"
    @click="onClick"
  >
    <div
      v-if="$slots.icon"
      class="mode-card__icon"
      :class="{ 'mode-card__icon--ghost': iconGhost }"
    >
      <slot name="icon" />
    </div>
    <div
      v-if="$slots.badge"
      class="mode-card__badge-slot"
    >
      <slot name="badge" />
    </div>
    <div class="mode-card__title">
      {{ title }}
    </div>
    <div
      v-if="desc"
      class="mode-card__desc"
    >
      {{ desc }}
    </div>
    <div
      v-if="$slots.footer"
      class="mode-card__footer"
    >
      <slot name="footer" />
    </div>
    <span
      v-if="soonLabel"
      class="mode-card__soon"
    >{{ soonLabel }}</span>
    <span
      v-else-if="showArrow"
      class="mode-card__arrow"
      aria-hidden="true"
    >
      <AppIcon
        name="arrow-right"
        :size="20"
      />
    </span>
  </component>
</template>

<script setup lang="ts">
import AppIcon from '@app/shared/ui/AppIcon/AppIcon.vue';

const props = withDefaults(defineProps<{
  title: string;
  desc?: string;
  size?: 'md' | 'lg';
  brand?: boolean;
  disabled?: boolean;
  showArrow?: boolean;
  iconGhost?: boolean;
  /** «скоро» — лейбл слева от стрелки для нереализованных режимов. */
  soonLabel?: string;
  tag?: 'button' | 'div' | 'a';
}>(), {
  desc: '',
  size: 'md',
  brand: false,
  disabled: false,
  showArrow: true,
  iconGhost: false,
  soonLabel: '',
  tag: 'button',
});

const emit = defineEmits<{ click: [event: MouseEvent] }>();

function onClick(e: MouseEvent): void {
  // Не реализованные фичи (soonLabel) не кликабельны — только визуальная подсказка.
  if (props.disabled || props.soonLabel) return;
  emit('click', e);
}
</script>

<style scoped lang="scss">
@use '../../../assets/mixins' as m;

.mode-card {
  display: flex;
  flex-direction: column;

  // <button> user-agent даёт align-items: center → содержимое схлапывалось по центру.
  align-items: stretch;
  gap: var(--sp-3);
  padding: var(--sp-5);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-xl);
  cursor: pointer;
  text-align: left;
  text-decoration: none;
  color: inherit;
  position: relative;
  overflow: hidden;
  transition:
    border-color var(--dur-base) var(--ease-out),
    background var(--dur-base) var(--ease-out),
    transform var(--dur-fast) var(--ease-out),
    box-shadow var(--dur-base) var(--ease-out);

  @include m.focus-ring;
}

// Generic hover: только для не-brand карточек, иначе :hover перебивал бы accent-фон.
.mode-card:hover:not(.mode-card--disabled, .mode-card--brand) {
  border-color: var(--border-strong);
  background: var(--surface-hover);
}

.mode-card:active:not(.mode-card--disabled) {
  transform: translateY(0.5px);
}

.mode-card--lg {
  min-height: 200px;
}

.mode-card--brand {
  background: var(--accent);
  color: var(--accent-fg);
  border-color: var(--accent);
}

.mode-card--brand:hover {
  background: var(--accent-hover);
  border-color: var(--accent-hover);
}

.mode-card--disabled {
  opacity: 0.6;
  cursor: not-allowed;

  // Не анимируем accent-стрелку, не меняем фон при hover.
  &:hover {
    background: var(--surface);
    border-color: var(--border);
  }
}

.mode-card__icon {
  width: 48px;
  height: 48px;
  border-radius: var(--r-md);
  background: var(--surface-2);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--accent);
}

.mode-card__icon--ghost {
  background: transparent;
}

.mode-card--brand .mode-card__icon {
  background: rgb(255 255 255 / 0.15);
  color: var(--accent-fg);
}

.mode-card__title {
  font-family: var(--font-display), sans-serif;
  font-size: var(--fs-xl);
  font-weight: 600;
  letter-spacing: var(--tracking-tight);

  // Прижимаем title+desc к низу карточки (v3): icon сверху, заголовок снизу.
  margin-top: auto;
  color: var(--text);
}

.mode-card--brand .mode-card__title {
  color: #fff;
}

.mode-card--lg .mode-card__title {
  font-size: var(--fs-2xl);
}

.mode-card__desc {
  font-size: var(--fs-sm);
  color: var(--text-muted);
  line-height: var(--lh-snug);
}

.mode-card--brand .mode-card__desc {
  color: rgb(255 255 255 / 0.85);
}

.mode-card__badge-slot {
  // По v3 badge — в потоке слева под иконкой, не absolute top-right
  // (top-right занят стрелкой).
  align-self: flex-start;
}

.mode-card__footer {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  margin-top: auto;
  font-size: var(--fs-xs);
  color: var(--text-faint);
}

.mode-card__arrow {
  position: absolute;
  top: var(--sp-5);
  right: var(--sp-5);
  width: 20px;
  height: 20px;
  color: var(--text-faint);
  transition: transform var(--dur-base) var(--ease-out), color var(--dur-base) var(--ease-out);

}

// На brand-карточке стрелка уже белая (accent-fg) — :hover её не перекрашивает.
.mode-card:hover:not(.mode-card--disabled, .mode-card--brand) .mode-card__arrow {
  color: var(--accent);
}

.mode-card--brand .mode-card__arrow {
  color: #fff;
}

.mode-card:hover:not(.mode-card--disabled) .mode-card__arrow {
  transform: translateX(2px);
}

// «скоро» — в правом верхнем углу вместо стрелки.
.mode-card__soon {
  position: absolute;
  top: var(--sp-5);
  right: var(--sp-5);
  font-family: var(--font-mono);
  font-size: var(--fs-2xs);
  letter-spacing: var(--tracking-wider);
  text-transform: uppercase;
  color: var(--text-faint);
  pointer-events: none;
}

.mode-card--brand .mode-card__soon {
  color: rgb(255 255 255 / 0.8);
}
</style>
