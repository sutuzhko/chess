/** Service-store для persistence-адаптеров. См. docs/codebase/service-stores.md */
import type {
  MatchRepository,
} from '@modules/game/application/ports/MatchRepository.js';
import type {
  ClockStateStore,
} from '@modules/game/infrastructure/persistence/ClockStateStore.js';
import type {
  MatchConfigStore,
} from '@modules/game/infrastructure/persistence/MatchConfigStore.js';
import type {
  ShvedkiStateStore,
} from '@modules/game/infrastructure/persistence/ShvedkiStateStore.js';
import { invariant } from '@shared/lib/assert.js';
import { defineStore } from 'pinia';
import { shallowRef } from 'vue';

export interface PersistenceBundle {
  readonly matchRepository: MatchRepository;
  readonly matchConfig: MatchConfigStore;
  readonly shvedkiState: ShvedkiStateStore;
  readonly clockState: ClockStateStore;
}

export const usePersistenceService = defineStore('services/persistence', () => {
  const ref = shallowRef<PersistenceBundle | null>(null);

  function setPersistence(bundle: PersistenceBundle): void {
    ref.value = bundle;
  }

  function persistence(): PersistenceBundle {
    invariant(ref.value, 'Persistence is not initialized — call setPersistence() in main.ts before mounting');
    return ref.value;
  }

  return { setPersistence, persistence };
});
