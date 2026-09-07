import { renderInline } from '@metanull/viewer-core'

// The two `EssayView` specs this site declares: an exhibition's theme (its
// pages, each a quote + prose narrative over a thumbnail-driven item panel)
// and its introduction (the exhibition's own text plus the items attached
// to the exhibition itself, not to any theme/page — an "about" page, no
// panel or navigation). Both are built against a tree already scoped to one
// exhibition (`composables/exhibitions.js`'s `exhibitionTree`), never the
// whole-site one, so `route()` below can read the exhibition id off the
// tree itself rather than being handed it separately.

// The importer synthesizes a placeholder title ("Theme 5", "Page 17") when
// the legacy source has no page_title/theme_title for a given language;
// `EssayView` treats a title matching this as missing and falls back to the
// English one itself.
export const THEME_PLACEHOLDER_TITLE = /^(Theme|Page) \d+$/

function itemEntry(node, itemId) {
  return node?.items?.find((entry) => entry.id === itemId) ?? null
}

function localCaption(entry, language) {
  return entry?.caption?.[language] ?? entry?.caption?.en ?? {}
}

// A node's own route, for the breadcrumb (`spec.breadcrumb: true` below)
// and for `navigation: 'tree'`'s previous/next, both of which can hand this
// any depth: the exhibition itself (`parents.length === 0`, the breadcrumb's
// own first crumb), a theme (`=== 1` — reached only by crossing a branch
// boundary in the tree, since a theme carries no text or items of its own
// to route to directly; this lands on its first page instead, same as a
// visitor arriving from the splash list), or a page (`=== 2`, its own
// address, plus `?tab` unless it is the theme's first page).
export function themeRoute(tree) {
  return (node) => {
    const exhibitionId = tree.root.value?.id
    const parents = tree.parents(node.id)
    if (parents.length === 0) {
      return { name: 'exhibition', params: { exhibitionId } }
    }
    if (parents.length === 1) {
      return { name: 'exhibition-theme', params: { exhibitionId, themeId: node.id }, query: {} }
    }
    const themeNode = parents[1]
    const siblings = tree.children(themeNode.id)
    const tab = siblings.findIndex((sibling) => sibling.id === node.id)
    return { name: 'exhibition-theme', params: { exhibitionId, themeId: themeNode.id }, query: tab > 0 ? { tab } : {} }
  }
}

export function exhibitionThemeSpec(tree) {
  return {
    tree,
    entity: 'items',
    route: themeRoute(tree),
    placeholder: THEME_PLACEHOLDER_TITLE,
    quote: 'quote',
    body: 'description',
    items: {
      of: (node) => (node.items ?? []).map((entry) => entry.id),
      caption: (item, node, ctx) => {
        const caption = localCaption(itemEntry(node, item.id), ctx.language)
        const override = {}
        if (caption.name) override.name = renderInline(String(caption.name))
        return override
      },
      route: (item) => ({ name: 'item', params: { id: item.id } }),
    },
    panel: {
      // Only the alternate images: a "detail" close-up's own caption does
      // not replace the panel's fields below — `EssayView` has no notion of
      // a selected *variant*, only a selected *item* (metanull/viewer-layout#…,
      // see the pull request description).
      variants: (item, ctx) => {
        const entry = itemEntry(ctx.node, item.id)
        return (entry?.details ?? []).map((variant) => {
          const caption = localCaption(variant, ctx.language)
          const label = caption.detail_name ?? caption.name ?? ''
          return { url: variant.image_url, alt: label, caption: label }
        })
      },
      fields: (item, node, ctx) => {
        const caption = localCaption(itemEntry(node, item.id), ctx.language)
        const own = ctx.tr('items', item.id)
        const rows = []
        const date = caption.date ?? own.dates
        if (date) rows.push({ label: '', value: date })
        const location = caption.location ?? own.location
        if (location) rows.push({ label: '', value: location })
        return rows
      },
    },
    navigation: 'tree',
    breadcrumb: true,
    tabs: true,
    numbering: false,
  }
}

export function exhibitionIntroductionSpec(tree) {
  return {
    tree,
    entity: 'items',
    route: themeRoute(tree),
    // The introduction's own heading and prose are `extra.intro_header` /
    // `extra.intro_text` — a second, distinct pair of fields on the same
    // exhibition record the splash reads `title`/`description` from, not
    // reachable through `spec.quote`/`body` (both a flat field of the
    // node's translation, never a nested one); the heading is declared
    // here, the prose goes through the `before-body` slot instead.
    heading: (ctx) => renderInline(String(ctx.text.extra?.intro_header ?? ctx.t('exhibition.nav.introduction'))),
    quote: false,
    body: false,
    about: () => true,
    items: {
      of: (node) =>
        [...(node.items ?? [])]
          .sort((a, b) => (a.display_order ?? 9999) - (b.display_order ?? 9999))
          .map((entry) => entry.id),
      caption: (item, node, ctx) => {
        const caption = localCaption(itemEntry(node, item.id), ctx.language)
        const override = {}
        if (caption.name) override.name = renderInline(String(caption.name))
        return override
      },
      route: (item) => ({ name: 'item', params: { id: item.id } }),
    },
    panel: false,
  }
}
