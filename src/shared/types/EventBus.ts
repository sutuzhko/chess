import type { DomainEvent } from './DomainEvent.js';

/** Открытый реестр доменных событий. Каждый модуль расширяет его через declaration merging. См. docs/codebase/domain-events.md */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface DomainEventMap {}

export type EventHandler<E extends DomainEvent = DomainEvent> = (event: E) => void;
export type Unsubscribe = () => void;

export interface EventBus {
  publish(event: DomainEvent): void;

  /** Подписка на известный тип события: handler получает `DomainEventMap[K]`. */
  subscribe<K extends keyof DomainEventMap>(
    type: K,
    handler: (event: DomainEventMap[K]) => void,
  ): Unsubscribe;
  subscribe(type: string, handler: EventHandler): Unsubscribe;

  subscribeAll(handler: EventHandler): Unsubscribe;
}
