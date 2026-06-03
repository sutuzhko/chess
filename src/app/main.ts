import './assets/tokens.scss';
import './assets/app.scss';
import {
  ComputeShvedkiAiMoveUseCase,
  OpeningBook,
} from '@modules/game/application';

/* eslint-disable @typescript-eslint/no-restricted-imports --
 Composition root: единственное место в проекте, где Vue Shell имеет право
 видеть конкретные реализации из infrastructure/. См. docs/codebase/composition-root.md */
import {
  ShvedkiEngineAdapter,
} from '@modules/game/infrastructure/engine/shvedki';
import {
  WorkerEngineAdapter,
} from '@modules/game/infrastructure/engine/WorkerEngineAdapter.js';
import {
  LocalOpeningSource,
} from '@modules/game/infrastructure/opening/LocalOpeningSource.js';
import {
  ClockStateStore,
} from '@modules/game/infrastructure/persistence/ClockStateStore.js';
import {
  LocalStorageMatchRepository,
} from '@modules/game/infrastructure/persistence/LocalStorageMatchRepository.js';
import {
  MatchConfigStore,
} from '@modules/game/infrastructure/persistence/MatchConfigStore.js';
import {
  ShvedkiStateStore,
} from '@modules/game/infrastructure/persistence/ShvedkiStateStore.js';
import '@modules/game/domain/events.registry.js';
/* eslint-enable @typescript-eslint/no-restricted-imports */
import { InMemoryEventBus } from '@shared/lib/event-bus/InMemoryEventBus.js';

import { createPinia } from 'pinia';
import { createApp } from 'vue';
import App from './App.vue';
import { DynamicOpeningSource } from './composition/opening-source.js';
import openingBookData from './features/openings/data/opening-book.json';
import router from './router';
import { i18n } from './shared/i18n';
import { injectSvgSprite } from './shared/ui/AppIcon';
import { useLichessAuthStore } from './stores/lichess-auth.js';

import { useEngineService } from './stores/services/engine.js';
import { useEventBusService } from './stores/services/event-bus.js';
import { useOpeningSourceService } from './stores/services/opening-source.js';
import { usePersistenceService } from './stores/services/persistence.js';
import { useShvedkiAiService } from './stores/services/shvedki-ai.js';
import { useSettingsStore } from './stores/settings.js';

injectSvgSprite();

const app = createApp(App);
const pinia = createPinia();
app.use(pinia);

const openingBook = OpeningBook.fromPrecomputed(openingBookData);
const local = new LocalOpeningSource(openingBook);
// DynamicOpeningSource читает Pinia-сторы per-request; нужны живые
// инстансы стора — поэтому инициализируем их явно через `pinia`.
const openingSource = new DynamicOpeningSource({
  settings: useSettingsStore(pinia),
  lichessAuth: useLichessAuthStore(pinia),
  local,
});
useEventBusService(pinia).setEventBus(new InMemoryEventBus());
useOpeningSourceService(pinia).setOpeningSource(openingSource);
useEngineService(pinia).setEngine(WorkerEngineAdapter.create(openingSource));
useShvedkiAiService(pinia).setUseCase(
  new ComputeShvedkiAiMoveUseCase(new ShvedkiEngineAdapter(), openingSource),
);
usePersistenceService(pinia).setPersistence({
  matchRepository: new LocalStorageMatchRepository(window.localStorage),
  matchConfig: new MatchConfigStore(window.localStorage),
  shvedkiState: new ShvedkiStateStore(window.localStorage),
  clockState: new ClockStateStore(window.localStorage),
});

app.use(router);
app.use(i18n);

// Инициализируем settings store до mount, чтобы атрибуты темы появились на <html>
// раньше первого рендера (иначе SplashScreen вспыхивает тёмной палитрой по умолчанию).
useSettingsStore(pinia);

app.config.errorHandler = (err, _instance, info) => {
  console.error('[vue:errorHandler]', info, err);
};

app.mount('#app');
