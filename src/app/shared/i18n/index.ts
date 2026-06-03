import openingNames from '@app/features/openings/i18n/opening-names.json';
import { createI18n } from 'vue-i18n';
import en from './en.json';
import es from './es.json';
import ru from './ru.json';

export const SUPPORTED_LOCALES = ['ru', 'en', 'es'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'ru';

// Имена дебютов приходят из lichess-org/chess-openings как ключи "openingNames.<slug>".
// Пока английские, мерджатся во все локали; per-locale файлы можно наложить сверху.
const openingNamesMessages: Record<string, string> = openingNames;

type MessageSchema = typeof ru & { openingNames: Record<string, string> };

export const i18n = createI18n<[MessageSchema], Locale>({
  legacy: false,
  locale: DEFAULT_LOCALE,
  fallbackLocale: DEFAULT_LOCALE,
  messages: {
    ru: { ...ru, openingNames: openingNamesMessages },
    en: { ...en, openingNames: openingNamesMessages },
    es: { ...es, openingNames: openingNamesMessages },
  },
});

interface ComposerLocale {
  value: Locale;
}

export function setLocale(locale: Locale): void {
  (i18n.global.locale as unknown as ComposerLocale).value = locale;
}
