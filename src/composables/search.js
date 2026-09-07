import { centuryPresets, combineExpansions, countryExpansion, glossaryExpansion, useKeywordIndex } from '@metanull/viewer-core'
import { useInventoryData } from './useInventoryData.js'
import { DATE_MODE, PAGE_SIZE, SEARCH_FIELDS, SEARCH_FIELD_ENTRIES, inScope } from './catalogue.js'

// The search specs: what viewer-layout's `SearchFormView` renders on
// `/database` (`mode: 'rows'`, legacy `database.php`'s three keyword rows)
// and `/permanent-collection` (`mode: 'radio'`, legacy's one-filter-at-a-time
// form), and what `CatalogueResultsView` renders on `/database/results` —
// the field grammar over viewer-core's own keyword index. Decision D3 turns
// on `rank: 'hits'` (legacy's `ORDER BY nn DESC, pkdate ASC`) and the
// glossary/country expansions (`database_results.php`'s two lookup rules).

const { countryLabel, itemLabel, mdInline, tr } = useInventoryData()

export const databaseSearch = {
  mode: 'rows',
  fields: SEARCH_FIELD_ENTRIES,
  dates: { presets: centuryPresets() },
  // The search language is a record-level filter (which language the
  // keyword is matched against), never the site's own display language.
  language: 'items',
  extras: [{ key: 'epm', type: 'checkbox', label: 'islamicart.filter.includeEpm' }],
  target: 'database-results',
  showAllLabel: 'catalogue.search.showAll',
  // Legacy's field grammar takes no operators (`+`, `-`, `*`, quoted
  // phrases); there is no search-syntax essay to link to.
  howTo: false,
}

// `options` is `useFacets(items, FACETS)`'s own result (composables/catalogue.js),
// read by PcEntrance.vue — the radio facets' own values, sourced from the
// records the way every other facet on this site is, never invented here.
export function pcEntranceSearch(options) {
  return {
    mode: 'radio',
    facets: [
      { key: 'country', label: 'catalogue.facet.country', options: options.country ?? [] },
      { key: 'dynasty', label: 'catalogue.facet.periodDynasty', options: options.dynasty ?? [] },
      { key: 'partner', label: 'catalogue.facet.holdingInstitution', options: options.partner ?? [] },
      { key: 'begin', label: 'catalogue.facet.startDate', type: 'year' },
      { key: 'end', label: 'catalogue.facet.endDate', type: 'year' },
    ],
    // Writes the exact keys `permanentCollection` (composables/catalogue.js)
    // already reads — this entrance is the only thing this story changes on
    // that page's path; the results spec is untouched.
    extras: [{ key: 'epm', type: 'checkbox', label: 'islamicart.filter.includeEpm' }],
    target: 'permanent-collection-results',
  }
}

// The four keyword rows `SearchFormView` ('rows' mode) and the results
// page's own refine row write between them: `q`/`field` for the first,
// `q2`/`field2`/`op2` and `q3`/`field3`/`op3` from the entrance, `q4`/
// `field4`/`op4` for the refine row this results page adds on top.
function keywordRows(filters) {
  return [1, 2, 3, 4].map((n) => ({
    keyword: n === 1 ? filters.q : filters[`q${n}`],
    field: (n === 1 ? filters.field : filters[`field${n}`]) || 'keyword',
    cond: n === 1 ? 'AND' : filters[`op${n}`] || 'AND',
  }))
}

function search(list, filters) {
  const index = useKeywordIndex('items', {
    grammar: 'fields',
    fields: SEARCH_FIELDS,
    language: filters.lang || 'en',
    rank: 'hits',
    expand: combineExpansions(glossaryExpansion(), countryExpansion()),
  })
  const matches = index.search(keywordRows(filters))
  // The index searches every item regardless of scope; `list` is what
  // `scope` (ISL/EPM) already narrowed it to, so this keeps the index's own
  // rank order while dropping what scope excluded.
  const allowed = new Set(list.map((item) => item.id))
  return matches.filter((item) => allowed.has(item.id))
}

// The row: the thumbnail, the name, the country, the date and the location
// — legacy database_results.php's own row, distinct from the Permanent
// Collection's (which reads dynasty/holder instead of location).
function searchRecord(item) {
  const text = tr('items', item.id)
  return {
    id: item.id,
    image: item.images?.[0]?.url ?? '',
    imageAlt: itemLabel(item),
    name: mdInline(text.name ?? item.internal_name ?? item.id),
    meta: [countryLabel(item.country_id), text.dates, text.location].filter(Boolean),
    badge: item.type,
    to: { name: 'item', params: { id: item.id } },
  }
}

// Each branch spells its own name in full, for the same reason
// `useSearchFields` (composables/catalogue.js) does.
function fieldLabel(value, t) {
  switch (value) {
    case 'keyword': return t('catalogue.field.keywords')
    case 'name': return t('sheet.field.name')
    case 'location': return t('sheet.field.location')
    case 'provenance': return t('sheet.field.provenance')
    case 'dynasty': return t('catalogue.facet.periodDynasty')
    case 'patron': return t('catalogue.field.patron')
    case 'artist': return t('catalogue.field.artist')
    case 'material': return t('catalogue.field.material')
    case 'other': return t('catalogue.field.other')
    default: return value
  }
}

// Legacy's own recap line: what was searched, spelled out — never just a
// count, so a visitor who scrolls past the form still reads what for.
function searchedFor(filters, t) {
  const parts = keywordRows(filters)
    .filter((row) => row.keyword)
    .map((row, i) => `${i > 0 ? `${row.cond} ` : ''}${fieldLabel(row.field, t)}: "${row.keyword}"`)
  if (filters.from) parts.push(`${t('catalogue.filter.from')} ${filters.from}`)
  if (filters.to) parts.push(`${t('catalogue.filter.to')} ${filters.to}`)
  if (filters.lang) parts.push(`${t('catalogue.search.language')}: ${filters.lang.toUpperCase()}`)
  if (filters.epm === '1') parts.push(`+ ${t('core.project.explorePartners')}`)
  return parts
}

export const databaseResults = {
  entity: 'items',
  keys: ['q', 'field', 'q2', 'field2', 'op2', 'q3', 'field3', 'op3', 'q4', 'field4', 'op4', 'from', 'to', 'lang', 'epm'],
  scope: (item, filters) => inScope(item, filters.epm === '1'),
  narrow: (list, filters) => search(list, filters),
  dates: { mode: DATE_MODE, begin: 'from', end: 'to' },
  // `rank: 'hits'` already ordered the matches (or the entity order stood,
  // on an empty query); resorting here would discard that order.
  sort: false,
  pageSize: PAGE_SIZE,
  variant: 'list',
  recordRoute: 'item',
  record: searchRecord,
  summary: ({ filters, pageInfo, t }) => {
    const parts = searchedFor(filters, t)
    return [
      { label: t('catalogue.search.summary'), value: parts.length ? parts.join(' · ') : t('catalogue.results.allItems') },
      { label: t('catalogue.results.itemsFound'), count: pageInfo.total },
    ]
  },
  // The keyword refine row this results page adds on top of the entrance's
  // three; the field/operator selects beside it are this website's own
  // (DatabaseResults.vue's `filters` slot), since a field name is not a
  // record facet `CatalogueResultsView` can derive options for.
  filterTitle: 'catalogue.search.refine',
  controls: [{ key: 'q4', type: 'query', label: 'catalogue.search.refineHint', placeholder: 'catalogue.search.keywordPlaceholder' }],
  empty: 'catalogue.results.noResultsSearch',
  pagination: { window: 7 },
}
