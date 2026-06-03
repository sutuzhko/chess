<template>
  <details class="card">
    <summary class="card__header">
      <span class="card__title">FEN / PGN</span>
    </summary>
    <div class="card__body card__body--fen">
      <div class="field">
        <label class="field-label">FEN</label>
        <textarea
          :value="fen"
          class="textarea"
          rows="2"
          spellcheck="false"
          @input="emit('update:fen', ($event.target as HTMLTextAreaElement).value)"
        />
        <div class="fen-actions">
          <button
            class="btn btn--sm"
            @click="emit('applyFen')"
          >
            Apply FEN
          </button>
          <button
            class="btn btn--sm"
            @click="emit('copyFen')"
          >
            Copy
          </button>
        </div>
      </div>
      <div class="field">
        <label class="field-label">PGN</label>
        <textarea
          :value="pgn"
          class="textarea"
          placeholder="Вставьте PGN для импорта"
          rows="5"
          @input="emit('update:pgn', ($event.target as HTMLTextAreaElement).value)"
        />
        <div class="fen-actions">
          <button
            class="btn btn--sm"
            @click="emit('exportPgn')"
          >
            Экспорт
          </button>
          <button
            class="btn btn--sm"
            @click="emit('importPgn')"
          >
            Импорт
          </button>
        </div>
      </div>
    </div>
  </details>
</template>

<script setup lang="ts">
defineProps<{
  fen: string;
  pgn: string;
}>();

const emit = defineEmits<{
  'update:fen': [v: string];
  'update:pgn': [v: string];
  applyFen: [];
  copyFen: [];
  exportPgn: [];
  importPgn: [];
}>();
</script>

<style scoped lang="scss">
@use '../../../assets/mixins' as m;
@include m.card;
@include m.buttons;

/* — forms (.field, .input, .select, .textarea) — */
.field {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}

.field-label {
  font-size: var(--fs-xs);
  color: var(--text-muted);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  font-weight: 500;
}

.input, .select, .textarea {
  width: 100%;
  height: 36px;
  padding: 0 var(--sp-3);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  background: var(--bg-elev);
  color: var(--text);
  font-family: var(--font-sans), sans-serif;
  font-size: var(--fs-sm);
  transition: border-color var(--dur-fast) var(--ease-out),
              background var(--dur-fast) var(--ease-out);

  &:focus {
    outline: none;
    border-color: var(--accent);
    background: var(--surface);
  }
}

.textarea {
  height: auto;
  padding: var(--sp-3);
  font-family: var(--font-mono), sans-serif;
  font-size: var(--fs-xs);
  line-height: 1.55;
  resize: vertical;
}

.select {
  appearance: none;
  background-image: linear-gradient(45deg, transparent 50%, var(--text-muted) 50%),
                    linear-gradient(135deg, var(--text-muted) 50%, transparent 50%);
  background-position: calc(100% - 14px) 16px, calc(100% - 9px) 16px;
  background-size: 5px 5px, 5px 5px;
  background-repeat: no-repeat;
  padding-right: var(--sp-7);
}

.card__body--fen {
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
}

.fen-actions {
  display: flex;
  gap: var(--sp-2);
  margin-top: var(--sp-2);
}

details.card > summary {
  list-style: none;
  cursor: pointer;
  user-select: none;

  &::-webkit-details-marker { display: none; }

  &::after {
    content: '›';
    margin-left: auto;
    transition: transform var(--dur-fast) var(--ease-out);
    color: var(--text-faint);
  }
}

details[open].card > summary::after { transform: rotate(90deg); }
</style>
