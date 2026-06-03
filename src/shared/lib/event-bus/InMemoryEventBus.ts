import type { DomainEvent } from '@shared/types/DomainEvent.js';
import type {
  DomainEventMap,
  EventBus,
  EventHandler,
  Unsubscribe,
} from '@shared/types/EventBus.js';

export class InMemoryEventBus implements EventBus {
  private readonly typed = new Map<string, Set<EventHandler>>();
  private readonly all = new Set<EventHandler>();

  publish(event: DomainEvent): void {
    const set = this.typed.get(event.type);
    if (set) {
      for (const h of set) h(event);
    }
    for (const h of this.all) h(event);
  }

  subscribe<K extends keyof DomainEventMap>(
    type: K,
    handler: (event: DomainEventMap[K]) => void,
  ): Unsubscribe;
  subscribe(type: string, handler: EventHandler): Unsubscribe;
  subscribe(type: string, handler: EventHandler): Unsubscribe {
    let set = this.typed.get(type);
    if (!set) {
      set = new Set();
      this.typed.set(type, set);
    }
    set.add(handler);
    return () => {
      const s = this.typed.get(type);
      s?.delete(handler);
    };
  }

  subscribeAll(handler: EventHandler): Unsubscribe {
    this.all.add(handler);
    return () => {
      this.all.delete(handler);
    };
  }
}
