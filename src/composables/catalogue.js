import { computed } from 'vue'
import { useI18n } from '@metanull/viewer-core'
import { useInventoryData } from './useInventoryData.js'

// The catalogue spec: what this website's lists filter and search on. The
// engine — query state, options, dates, pages, the keyword grammar — is
// viewer-core's; what is declared here is only what is this website's: the
// scope rule, the date rule, the nine fields of the legacy search form, and
// the three facets of the Permanent Collection. Two entrances and two
// results pages read this one declaration.

const {
  countries, dynasties, dynastyLabel, countryLabel, partnerLabel, partners, itemProjectKey,
} = useInventoryData()

/** Twenty rows a page, as the legacy pages showed. */
export const PAGE_SIZE = 20

/** Decision D5: the standalone sites test overlap, tolerating a single date. */
export const DATE_MODE = 'overlap'

/**
 * 'ISL' ("Discover Islamic Art") is always searched and browsed; any other
 * exported project ('EPM', "Explore Islamic Art Collections") is opt-in —
 * legacy database.php's "Include Explore Islamic Art Collections" checkbox.
 */
export function inScope(item, includeEpm) {
  const key = itemProjectKey(item)
  return !key || key === 'ISL' || Boolean(includeEpm)
}

// ── The nine fields of database.php ────────────────────────────────────────
//
// What each searches is the legacy form's, field for field. `text` is the
// record's translation in the search language, with English behind it.

export const SEARCH_FIELDS = {
  keyword: (item, text) => [text.name ?? item.internal_name, text.alternate_name, text.description, ...(item.tags ?? [])],
  name: (item, text) => text.name ?? item.internal_name,
  location: (item, text) => text.location,
  provenance: (item, text) => text.provenance,
  dynasty: (item) => (item.dynasty_ids ?? []).map(dynastyLabel),
  patron: (item, text) => text.patrons ?? text.initial_owner,
  artist: (item, text) => [...(item.artist_names ?? []), text.architects],
  material: (item, text) => text.type,
  // The catch-all across the descriptive fields the other eight leave out.
  other: (item, text) => [
    text.description, text.method_for_datation, text.method_for_provenance, text.obtention,
    text.bibliography, text.workshop, text.scriber, text.binding_desc, text.history,
  ],
}

/**
 * The field options of the search form, in legacy's order. `value` is the
 * query parameter and never a text; each label is written out, because the
 * check that every name resolves can only see the ones it can read.
 */
export function useSearchFields() {
  const { t } = useI18n()
  return computed(() => [
    { value: 'keyword', label: t('islamicart.field.keywords') },
    { value: 'name', label: t('sheet.field.name') },
    { value: 'location', label: t('sheet.field.location') },
    { value: 'provenance', label: t('sheet.field.provenance') },
    { value: 'dynasty', label: t('catalogue.facet.periodDynasty') },
    { value: 'patron', label: t('islamicart.field.patron') },
    { value: 'artist', label: t('islamicart.field.artist') },
    { value: 'material', label: t('islamicart.field.material') },
    { value: 'other', label: t('islamicart.field.other') },
  ])
}

// ── The facets of the Permanent Collection ─────────────────────────────────
//
// Countries and institutions by name; dynasties in the order they rose, as
// legacy listed them. A value the reference entity does not carry is not
// offered: the label would be an id.

const dynastyFrom = (id) => dynasties.value?.find((d) => d.id === id)?.from_ad ?? 9999

export const FACETS = {
  country: {
    field: 'country_id',
    label: countryLabel,
    include: (id) => (countries.value ?? []).some((c) => c.id === id),
  },
  dynasty: {
    values: (item) => item.dynasty_ids ?? [],
    label: dynastyLabel,
    include: (id) => (dynasties.value ?? []).some((d) => d.id === id),
    sort: (a, b) => dynastyFrom(a.value) - dynastyFrom(b.value),
  },
  partner: {
    field: 'partner_id',
    label: partnerLabel,
    include: (id) => (partners.value ?? []).some((p) => p.id === id),
  },
}
