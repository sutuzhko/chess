/** Service-store для движка. См. docs/codebase/service-stores.md */
import type {
  EngineAdapter,
} from '@modules/game/application/ports/EngineAdapter.js';
import { invariant } from '@shared/lib/assert.js';
import { defineStore } from 'pinia';
import { shallowRef } from 'vue';

export const useEngineService = defineStore('services/engine', () => {
  const ref = shallowRef<EngineAdapter | null>(null);

  function setEngine(adapter: EngineAdapter): void {
    ref.value = adapter;
  }

  function engine(): EngineAdapter {
    invariant(ref.value, 'EngineAdapter is not initialized — call setEngine() in main.ts before mounting');
    return ref.value;
  }

  return { setEngine, engine };
});
