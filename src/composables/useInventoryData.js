import { computed } from 'vue'
import {
  byId, entityRef, renderBlock, renderInline, renderPlain, useDataPackage,
} from '@metanull/viewer-core'

// The website's records, read the one way every website reads them: through
// viewer-core, lazily. Each entity is a shared ref that stays `null` until a
// route declaring it in `meta.entities` brings its chunk in, so importing
// this module loads nothing, and a page pays only for what it reads.
// Translations are viewer-core's cache, not a second one kept here.

const dataPackage = useDataPackage()
export const manifest = dataPackage.manifest

// ── Records ────────────────────────────────────────────────────────────────

const items = entityRef('items')
const countries = entityRef('countries')
const partners = entityRef('partners')
const dynasties = entityRef('dynasties')
const timelines = entityRef('timelines')
const timelineEvents = entityRef('timeline_events')
const collections = entityRef('collections')

// English is the base language of every catalogue in the platform: every list,
// label and fallback reads it. A record the visitor reads in another language
// is resolved on the sheet itself, by viewer-core's `useRecordLanguage`.
const defaultLang = 'en'

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

// ── Translations ───────────────────────────────────────────────────────────
//
// One file per entity per language, resolved by name through viewer-core:
// never `import(`…${lang}…`)`, which a bundler cannot resolve statically and
// so bundles every language of an entity eagerly. English drives every list
// and label and is loaded once; another language is loaded on demand by the
// page that reads it.

const { availableLanguages, loadTranslations, translations } = dataPackage

/** One record's translated fields, falling back to English then to nothing. */
function tr(entity, id, lang = defaultLang) {
  return dataPackage.tr(entity, id, lang, defaultLang)
}

const EN_ENTITIES = [
  'items', 'countries', 'dynasties', 'partners', 'timeline_events', 'collections',
]

let englishReady = null
function loadEnglishTranslations() {
  if (!englishReady) {
    englishReady = Promise.all(EN_ENTITIES.map(e => loadTranslations(e, defaultLang)))
  }
  return englishReady
}
loadEnglishTranslations()

// ── Labels (always English) ────────────────────────────────────────────────

function itemLabel(item) {
  if (!item) return ''
  return mdStrip(tr('items', item.id).name ?? item.internal_name ?? item.id)
}

function countryLabel(countryId) {
  if (!countryId) return ''
  const fallback = (countries.value ?? []).find(c => c.id === countryId)
  return mdStrip(tr('countries', countryId).name ?? fallback?.internal_name ?? countryId)
}

function dynastyLabel(dynastyId) {
  if (!dynastyId) return ''
  return mdStrip(tr('dynasties', dynastyId).name ?? dynastyId)
}

function partnerLabel(partnerId) {
  if (!partnerId) return ''
  const fallback = (partners.value ?? []).find(p => p.id === partnerId)
  return mdStrip(tr('partners', partnerId).name ?? fallback?.id ?? partnerId)
}

// ── Lookup maps ────────────────────────────────────────────────────────────

const itemById = byId('items')

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

// ── Exhibitions ────────────────────────────────────────────────────────────
//
// Imported as generic Collections, nested under a dedicated "Virtual
// Exhibitions" marker collection (purpose "exhibitions-root", a child of
// the Islamic Art project collection) — needed because type='exhibition'
// alone is not project-scoped in the legacy schema (shared with Baroque
// Art, Sharing History, etc). From that anchor: exhibitions are its
// children, themes are an exhibition's children, pages are a theme's
// children (tabs). "Introduction" is not a theme — it's the exhibition's
// own translation (extra.intro_header / extra.intro_text) plus items
// attached directly to the exhibition collection itself (not to any
// theme/page).

const exhibitions = computed(() => {
  const marker = findByPurpose('exhibitions-root')
  if (!marker) return []
  return (collections.value ?? [])
    .filter(c => c.parent_id === marker.id)
    .sort((a, b) => (a.display_order ?? 9999) - (b.display_order ?? 9999))
})

function exhibitionById(id) {
  return exhibitions.value.find(e => e.id === id) ?? null
}

function exhibitionThemes(exhibitionId) {
  const all = collections.value ?? []
  return all
    .filter(c => c.parent_id === exhibitionId)
    .sort((a, b) => (a.display_order ?? 9999) - (b.display_order ?? 9999))
    .map(theme => ({
      ...theme,
      pages: all
        .filter(c => c.parent_id === theme.id)
        .sort((a, b) => (a.display_order ?? 9999) - (b.display_order ?? 9999)),
    }))
}

function exhibitionThemeById(exhibitionId, themeId) {
  return exhibitionThemes(exhibitionId).find(t => t.id === themeId) ?? null
}

// ── Item cross-links: Artistic Introduction pages / Exhibitions that
// feature a given item ───────────────────────────────────────────────────
//
// No separate export is needed for this: collections.json already lists
// each collection's items[] (used to render Artistic Introduction pages and
// Exhibition theme/page grids), so "which collections reference this item"
// is just a client-side reverse lookup over the same data. See Epic 12 in
// the islamicart parity backlog.

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

function exhibitionLinksForItem(itemId) {
  const marker = findByPurpose('exhibitions-root')
  if (!marker) return []
  const all = collections.value ?? []
  const links = []
  const seen = new Set()
  for (const c of collectionsContainingItem(itemId)) {
    // Either attached directly to the exhibition itself (an "introduction"
    // item — see the Exhibitions section comment above), or to a page
    // nested under a theme nested under the exhibition.
    let exhibition = null
    let themeId = null
    if (c.parent_id === marker.id) {
      exhibition = c
    } else {
      const theme = all.find(t => t.id === c.parent_id)
      const ex = theme && all.find(e => e.id === theme.parent_id)
      if (ex && ex.parent_id === marker.id) {
        exhibition = ex
        themeId = theme.id
      }
    }
    if (!exhibition) continue
    const key = `${exhibition.id}:${themeId ?? ''}`
    if (seen.has(key)) continue
    seen.add(key)
    links.push({
      exhibitionId: exhibition.id,
      themeId,
      label: tr('collections', exhibition.id).title ?? exhibition.internal_name,
    })
  }
  return links
}

// ── Markdown ───────────────────────────────────────────────────────────────
//
// The three renderers of viewer-core, and nothing else: a data package holds
// Markdown, every website renders it through the same pipeline, and a field
// that renders wrongly is fixed in the importer, where the data is made.
// `md` renders a record's text with its line breaks, and takes the glossary
// the sheet passes to highlight the terms it carries.

function md(text, glossary) {
  if (!text) return ''
  return renderBlock(text, { breaks: true, glossary })
}

function mdInline(text, glossary) {
  if (!text) return ''
  return renderInline(text, { glossary })
}

function mdStrip(text) {
  if (!text) return ''
  return renderPlain(text)
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
    loadEnglishTranslations,
    itemLabel,
    countryLabel,
    dynastyLabel,
    partnerLabel,
    itemProjectKey,
    itemById,
    artIntroRoot,
    artIntroThemes,
    artIntroThemeById,
    exhibitions,
    exhibitionById,
    exhibitionThemes,
    exhibitionThemeById,
    artIntroLinksForItem,
    exhibitionLinksForItem,
    md,
    mdInline,
    mdStrip,
  }
}
