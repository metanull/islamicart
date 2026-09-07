import { computed } from 'vue'
import { useCatalogueData, useDataPackage } from '@metanull/viewer-core'

// The website's records, read the one way every website reads them: through
// viewer-core, lazily. Each entity is a shared ref that stays `null` until a
// route declaring it in `meta.entities` brings its chunk in, so importing
// this module loads nothing, and a page pays only for what it reads.
// Translations, the Markdown pipeline and the label shape are
// `useCatalogueData`'s; what stays here is genuinely this site's own — the
// project-key rule, and the Artistic Introduction collection tree (the
// Exhibitions one moved to composables/exhibitions.js, over
// `useCollectionTree`; Artistic Introduction moves the same way in #46).

const dataPackage = useDataPackage()
const manifest = dataPackage.manifest

// English is the base language of every catalogue in the platform: every
// list, label and fallback reads it. A record the visitor reads in another
// language is resolved on the sheet itself, by viewer-core's
// `useRecordLanguage`.
const defaultLang = 'en'

const catalogue = useCatalogueData({
  eager: ['items', 'countries', 'dynasties', 'partners', 'timeline_events', 'collections'],
  defaultLanguage: defaultLang,
})
catalogue.loadEnglish()

const { availableLanguages, labelOf, loadTranslations, md, mdInline, mdStrip, translations, tr } = catalogue

// ── Records ────────────────────────────────────────────────────────────────

const items = catalogue.entity('items')
const countries = catalogue.entity('countries')
const partners = catalogue.entity('partners')
const dynasties = catalogue.entity('dynasties')
const timelines = catalogue.entity('timelines')
const timelineEvents = catalogue.entity('timeline_events')
const collections = catalogue.entity('collections')

const itemById = catalogue.index('items')

// Legacy project key (e.g. 'ISL', 'EPM') by project UUID — manifest.json's
// projectIds/projectKeys are parallel arrays, one exported project per index.
const projectKeyById = new Map(
  (manifest.projectIds ?? []).map((id, i) => [id, manifest.projectKeys?.[i]])
)

// 'ISL' ("Discover Islamic Art") is always the default/primary project; any other
// exported project (e.g. 'EPM', "Explore Islamic Art Collections") is opt-in —
// mirrors legacy's database.php "Include Explore Islamic Art Collections" checkbox.
function itemProjectKey(item) {
  return projectKeyById.get(item.project_id) ?? null
}

// ── Labels (always English) — `labelOf`'s one shape, over this site's entities.

function itemLabel(item) {
  return item ? labelOf('items', item.id) : ''
}

function countryLabel(countryId) {
  return countryId ? labelOf('countries', countryId) : ''
}

function dynastyLabel(dynastyId) {
  return dynastyId ? labelOf('dynasties', dynastyId) : ''
}

function partnerLabel(partnerId) {
  return partnerId ? labelOf('partners', partnerId) : ''
}

// Section anchors are resolved by `purpose` (#1505) —
// `backward_compatibility` is informational only and never parsed. The
// export is scoped to one project context, within which each root purpose
// occurs at most once.
function findByPurpose(purpose) {
  return (collections.value ?? []).find(c => c.purpose === purpose) ?? null
}

// ── Artistic Introduction (legacy "gai") ──────────────────────────────────
//
// Imported as generic Collections, nested under a dedicated "Artistic
// Introduction" marker collection (purpose "artistic-introduction-root", a
// child of the Islamic Art project collection). From that single,
// unambiguous anchor the rest of the tree — root, themes (e.g. "The
// Umayyads"), pages (tabs within a theme, e.g. "Monuments" / "Objects") —
// is just parent_id lookups, no internal_name guessing.

const artIntroRoot = computed(() => {
  const marker = findByPurpose('artistic-introduction-root')
  if (!marker) return null
  return (collections.value ?? []).find(c => c.parent_id === marker.id) ?? null
})

const artIntroThemes = computed(() => {
  const root = artIntroRoot.value
  if (!root) return []
  const all = collections.value ?? []
  const themes = all
    .filter(c => c.parent_id === root.id)
    .sort((a, b) => (a.display_order ?? 9999) - (b.display_order ?? 9999))
  return themes.map(theme => ({
    ...theme,
    pages: all
      .filter(c => c.parent_id === theme.id)
      .sort((a, b) => (a.display_order ?? 9999) - (b.display_order ?? 9999)),
  }))
})

function artIntroThemeById(id) {
  return artIntroThemes.value.find(t => t.id === id) ?? null
}

// ── Item cross-links: Artistic Introduction pages that feature a given item
// ───────────────────────────────────────────────────────────────────────
//
// No separate export is needed for this: collections.json already lists
// each collection's items[] (used to render Artistic Introduction pages),
// so "which collections reference this item" is just a client-side reverse
// lookup over the same data. See Epic 12 in the islamicart parity backlog.
// The Exhibitions equivalent (exhibitionLinksForItem) — and the rest of the
// Exhibitions tree (exhibitions, exhibitionThemes, exhibitionThemeById) —
// moved to composables/exhibitions.js, over `useCollectionTree`.

function collectionsContainingItem(itemId) {
  return (collections.value ?? []).filter(c => c.items?.some(it => it.id === itemId))
}

function artIntroLinksForItem(itemId) {
  const root = artIntroRoot.value
  if (!root) return []
  const links = []
  const seen = new Set()
  for (const page of collectionsContainingItem(itemId)) {
    // Items are attached to a theme's page; the page's parent is the theme.
    const theme = (collections.value ?? []).find(c => c.id === page.parent_id)
    if (!theme || theme.parent_id !== root.id || seen.has(theme.id)) continue
    seen.add(theme.id)
    links.push({
      themeId: theme.id,
      label: tr('collections', theme.id).title ?? theme.internal_name,
    })
  }
  return links
}

export function useInventoryData() {
  return {
    items,
    countries,
    partners,
    dynasties,
    timelines,
    timelineEvents,
    collections,
    defaultLang,
    availableLanguages,
    loadTranslations,
    translations,
    tr,
    itemLabel,
    countryLabel,
    dynastyLabel,
    partnerLabel,
    itemProjectKey,
    itemById,
    artIntroRoot,
    artIntroThemes,
    artIntroThemeById,
    artIntroLinksForItem,
    md,
    mdInline,
    mdStrip,
  }
}
