/** Service-store для EventBus. См. docs/codebase/service-stores.md */
import { invariant } from '@shared/lib/assert.js';
import type { EventBus } from '@shared/types/EventBus.js';
import { defineStore } from 'pinia';
import { shallowRef } from 'vue';

export const useEventBusService = defineStore('services/event-bus', () => {
  const ref = shallowRef<EventBus | null>(null);

  function setEventBus(bus: EventBus): void {
    ref.value = bus;
  }

  function eventBus(): EventBus {
    invariant(ref.value, 'EventBus is not initialized — call setEventBus() in main.ts before mounting');
    return ref.value;
  }

  return { setEventBus, eventBus };
});
