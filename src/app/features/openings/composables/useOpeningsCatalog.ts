import {
  OPENING_NAME_PREFIX,
  OPENINGS_CATALOG_MAX_VISIBLE,
  OPENINGS_ECO_GROUP_ALL,
  OPENINGS_ECO_GROUPS,
  type OpeningsCatalogFilter,
} from '@app/features/openings/config/openings-constants.js';
import openingNames from '@app/features/openings/i18n/opening-names.json';
import type { OpeningDef } from '@modules/game/application';
import { computed, type ComputedRef, ref, type Ref } from 'vue';
import { useI18n } from 'vue-i18n';

export interface UseOpeningsCatalogArgs {
  catalog: Readonly<Ref<readonly OpeningDef[]>> | ComputedRef<readonly OpeningDef[]> | (() => readonly OpeningDef[]);
}

export interface UseOpeningsCatalogReturn {
  search: Ref<string>;
  group: Ref<OpeningsCatalogFilter>;
  groups: readonly OpeningsCatalogFilter[];
  maxVisible: number;
  filtered: ComputedRef<readonly OpeningDef[]>;
  sections: ComputedRef<{ letter: string; items: OpeningDef[] }[]>;
  truncated: ComputedRef<boolean>;
  filteredLabel: ComputedRef<string>;
  totalLabel: ComputedRef<string>;
}

const nameMap = openingNames as Record<string, string>;

function englishName(key: string): string {
  return nameMap[key.slice(OPENING_NAME_PREFIX.length)] ?? key;
}

function groupOf(entry: OpeningDef): string {
  return (entry.eco ?? '?').charAt(0);
}

export function useOpeningsCatalog(args: UseOpeningsCatalogArgs): UseOpeningsCatalogReturn {
  const { locale } = useI18n();

  const ALL = OPENINGS_ECO_GROUP_ALL;
  const groups: readonly OpeningsCatalogFilter[] = [ALL, ...OPENINGS_ECO_GROUPS];
  const maxVisible = OPENINGS_CATALOG_MAX_VISIBLE;

  const search = ref('');
  const group = ref<OpeningsCatalogFilter>(ALL);

  const catalogList = computed<readonly OpeningDef[]>(() => {
    const c = args.catalog;
    if (typeof c === 'function') return c();
    return c.value;
  });

  const filtered = computed<readonly OpeningDef[]>(() => {
    const q = search.value.trim().toLowerCase();
    return catalogList.value.filter((e) => {
      if (group.value !== ALL && groupOf(e) !== group.value) return false;
      if (!q) return true;
      return (
        englishName(e.name).toLowerCase().includes(q) ||
        (e.eco ?? '').toLowerCase().includes(q)
      );
    });
  });

  const truncated = computed(() => filtered.value.length > maxVisible);

  const sections = computed<{ letter: string; items: OpeningDef[] }[]>(() => {
    const out: { letter: string; items: OpeningDef[] }[] = [];
    for (const entry of filtered.value.slice(0, maxVisible)) {
      const letter = groupOf(entry);
      const current = out.at(-1);
      if (current?.letter === letter) {
        current.items.push(entry);
      } else {
        out.push({ letter, items: [entry] });
      }
    }
    return out;
  });

  const filteredLabel = computed(() =>
    new Intl.NumberFormat(locale.value).format(filtered.value.length),
  );
  const totalLabel = computed(() =>
    new Intl.NumberFormat(locale.value).format(catalogList.value.length),
  );

  return { search, group, groups, maxVisible, filtered, sections, truncated, filteredLabel, totalLabel };
}
