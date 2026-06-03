/** Service-store для шведочного AI use-case. См. docs/codebase/service-stores.md */
import type { ComputeShvedkiAiMoveUseCase } from '@modules/game/application';
import { invariant } from '@shared/lib/assert.js';
import { defineStore } from 'pinia';
import { shallowRef } from 'vue';

export const useShvedkiAiService = defineStore('services/shvedki-ai', () => {
  const ref = shallowRef<ComputeShvedkiAiMoveUseCase | null>(null);

  function setUseCase(useCase: ComputeShvedkiAiMoveUseCase): void {
    ref.value = useCase;
  }

  function useCase(): ComputeShvedkiAiMoveUseCase {
    invariant(
      ref.value,
      'ComputeShvedkiAiMoveUseCase is not initialized — call setUseCase() in main.ts before mounting',
    );
    return ref.value;
  }

  return { setUseCase, useCase };
});
