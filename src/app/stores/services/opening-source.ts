/** Service-store для источника дебютных данных. См. docs/codebase/service-stores.md */
import type {
  OpeningSource,
} from '@modules/game/application/ports/OpeningSource.js';
import { invariant } from '@shared/lib/assert.js';
import { defineStore } from 'pinia';
import { shallowRef } from 'vue';

export const useOpeningSourceService = defineStore('services/opening-source', () => {
  const ref = shallowRef<OpeningSource | null>(null);

  function setOpeningSource(source: OpeningSource): void {
    ref.value = source;
  }

  function openingSource(): OpeningSource {
    invariant(
      ref.value,
      'OpeningSource is not initialized — call setOpeningSource() in main.ts before mounting',
    );
    return ref.value;
  }

  return { setOpeningSource, openingSource };
});
