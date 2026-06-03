import { InMemoryEventBus } from '@/shared/lib/event-bus/InMemoryEventBus';
import type { DomainEvent } from '@/shared/types/DomainEvent';
import { describe, expect, it } from 'vitest';

const evt = (type: string, payload: Record<string, unknown> = {}): DomainEvent =>
  ({ type, occurredAt: new Date(), ...payload }) as DomainEvent;

describe('InMemoryEventBus', () => {
  it('subscribe доставляет события подписчику нужного типа', () => {
    const bus = new InMemoryEventBus();
    const seen: DomainEvent[] = [];
    bus.subscribe('Foo', (e) => seen.push(e));
    bus.publish(evt('Foo'));
    expect(seen).toHaveLength(1);
  });

  it('subscribe не получает события чужого типа', () => {
    const bus = new InMemoryEventBus();
    const seen: DomainEvent[] = [];
    bus.subscribe('Foo', (e) => seen.push(e));
    bus.publish(evt('Bar'));
    expect(seen).toHaveLength(0);
  });

  it('subscribeAll получает все события независимо от типа', () => {
    const bus = new InMemoryEventBus();
    const seen: string[] = [];
    bus.subscribeAll((e) => seen.push(e.type));
    bus.publish(evt('Foo'));
    bus.publish(evt('Bar'));
    expect(seen).toEqual(['Foo', 'Bar']);
  });

  it('возвращаемая функция от subscribe отписывает', () => {
    const bus = new InMemoryEventBus();
    const seen: DomainEvent[] = [];
    const unsub = bus.subscribe('Foo', (e) => seen.push(e));
    bus.publish(evt('Foo'));
    unsub();
    bus.publish(evt('Foo'));
    expect(seen).toHaveLength(1);
  });

  it('возвращаемая функция от subscribeAll отписывает', () => {
    const bus = new InMemoryEventBus();
    const seen: DomainEvent[] = [];
    const unsub = bus.subscribeAll((e) => seen.push(e));
    bus.publish(evt('X'));
    unsub();
    bus.publish(evt('Y'));
    expect(seen).toHaveLength(1);
  });

  it('двойная отписка идемпотентна', () => {
    const bus = new InMemoryEventBus();
    const unsub = bus.subscribe('Foo', () => undefined);
    unsub();
    expect(() => { unsub(); }).not.toThrow();
  });

  it('несколько подписчиков на один тип получают событие', () => {
    const bus = new InMemoryEventBus();
    let a = 0;
    let b = 0;
    bus.subscribe('Foo', () => { a += 1; });
    bus.subscribe('Foo', () => { b += 1; });
    bus.publish(evt('Foo'));
    expect(a).toBe(1);
    expect(b).toBe(1);
  });

  it('publish без подписчиков не бросает', () => {
    const bus = new InMemoryEventBus();
    expect(() => { bus.publish(evt('Anything')); }).not.toThrow();
  });
});
