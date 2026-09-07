import { describe, expect, it, vi } from 'vitest'
import { createViewer, loadEntities, mergeMessages } from '@metanull/viewer-core'
import { checkOfferedLanguages } from '@metanull/viewer-core/testing'
import { catalogues as sharedTexts } from '@metanull/viewer-i18n/standalone'
import ownTexts from '../locales/en.json'
import config from '../src/dataset.config.js'
import { useInventoryData } from '../src/composables/useInventoryData.js'

// The same two layers main.js assembles, in the same order: the shared bundle
// first, this website's own file last. Mounting without them would prove
// nothing about the chrome — every text would render as its own name.
const messages = mergeMessages(sharedTexts, { en: ownTexts })

// Mounted on the address under test, as a visitor arrives from a link.
async function mountSite(hash = '#/') {
  window.location.hash = hash
  const app = createViewer({ ...config, messages })
  const host = document.createElement('div')
  document.body.appendChild(host)
  app.mount(host)
  await app.config.globalProperties.$router.isReady()
  return { app, host }
}

describe('website smoke test', () => {
  it('mounts against the configured data package', async () => {
    const { app, host } = await mountSite()

    expect(host.textContent).toContain(config.siteName)
    expect(host.querySelector('.mwnf-page')).not.toBeNull()

    // The website's own Home view (registered under the route name 'home')
    // must replace viewer-core's generic home view.
    expect(host.querySelector('.vc-home')).toBeNull()

    app.unmount()
    // Longer than vitest's default 5s. This mounts the whole website against
    // the real data package, and this one is the largest of the seven — it came
    // in around 5s and failed roughly one run in three, on main, whatever was
    // being changed. A blocking check that fails at random teaches people to
    // re-run it rather than read it.
  }, 20000)

  // The Permanent Collection list runs on the platform's composed results
  // view (metanull/viewer-core#50, metanull/viewer-layout#33): the rows, the
  // filter panel and the Explore checkbox come from the catalogue spec, and
  // what only this website has — the heading suffix — fills the view's slot.
  it('renders the Permanent Collection on the composed results view', async () => {
    const { app, host } = await mountSite('#/permanent-collection/results')
    await vi.waitFor(() => expect(host.querySelector('.mwnf-list__row')).not.toBeNull(), { timeout: 20000 })
    expect(host.querySelector('.mwnf-catalogue')).not.toBeNull()
    expect(host.querySelector('.mwnf-filter')).not.toBeNull()
    expect(host.querySelector('.mwnf-facet--checkbox input[type="checkbox"]')).not.toBeNull()
    expect(host.querySelector('.section-heading').textContent).toContain('Permanent Collection')
    // Legacy's count, in its two halves: objects and monuments.
    expect(host.querySelectorAll('.mwnf-summary__count').length).toBe(2)
    app.unmount()
  }, 60000)

  // The Explore checkbox writes the same URL key legacy's opt-in checkbox
  // did (`epm`), so the entrance's link keeps working: checking it must
  // widen the results beyond the always-searched 'ISL' project. The row
  // count alone would not show this — a page holds twenty rows regardless —
  // so this reads the summary's total instead.
  function summaryTotal(host) {
    return [...host.querySelectorAll('.mwnf-summary__count')]
      .reduce((sum, el) => sum + Number(el.textContent), 0)
  }

  it('widens the Permanent Collection when Explore is set in the URL', async () => {
    const { app: withoutEpm, host: hostWithoutEpm } = await mountSite('#/permanent-collection/results')
    await vi.waitFor(() => expect(hostWithoutEpm.querySelector('.mwnf-list__row')).not.toBeNull(), { timeout: 20000 })
    const totalWithoutEpm = summaryTotal(hostWithoutEpm)
    withoutEpm.unmount()

    const { app: withEpm, host: hostWithEpm } = await mountSite('#/permanent-collection/results?epm=1')
    await vi.waitFor(() => expect(hostWithEpm.querySelector('.mwnf-list__row')).not.toBeNull(), { timeout: 20000 })
    const totalWithEpm = summaryTotal(hostWithEpm)
    withEpm.unmount()

    expect(totalWithEpm).not.toBe(totalWithoutEpm)
  }, 60000)

  // The item sheet runs on the platform's composed record view
  // (metanull/viewer-core#50): the rows come from the sheet spec, and what
  // only this website has — the dynasty cards, the Artistic Introduction
  // links, the type badge — fills the view's slots. A monument and an object
  // read different field orders (composables/sheet.js), so both are mounted.
  it('renders an object sheet on the composed record view', async () => {
    const [items] = await loadEntities(['items'])
    const object = items.find((i) => i.type === 'object')
    const { app, host } = await mountSite(`#/item/${encodeURIComponent(object.id)}`)
    await vi.waitFor(() => expect(host.querySelector('.mwnf-sheet__label')).not.toBeNull(), { timeout: 20000 })
    expect(host.querySelector('.mwnf-record')).not.toBeNull()
    expect(host.querySelector('.detail-type-badge').textContent.trim()).toBe('object')
    expect(host.querySelector('.detail-title').textContent.trim()).not.toBe('')
    app.unmount()
  }, 60000)

  it('renders a monument sheet with a different field order than an object', async () => {
    const [items] = await loadEntities(['items'])
    const monument = items.find((i) => i.type === 'monument')
    const { app, host } = await mountSite(`#/item/${encodeURIComponent(monument.id)}`)
    await vi.waitFor(() => expect(host.querySelector('.mwnf-sheet__label')).not.toBeNull(), { timeout: 20000 })
    expect(host.querySelector('.detail-type-badge').textContent.trim()).toBe('monument')
    expect(host.querySelector('.detail-title').textContent.trim()).not.toBe('')
    const labels = [...host.querySelectorAll('.mwnf-sheet__label')].map((el) => el.textContent.trim())
    // A monument's date reads "Date of monument", an object's "Date of
    // object" — the two specs in composables/sheet.js name the same field
    // differently, and neither reads a holding museum.
    expect(labels).toContain('Date of monument')
    expect(labels).not.toContain('Date of object')
    expect(labels).not.toContain('Holding museum')
    app.unmount()
  }, 60000)

  // The Exhibitions entrance, splash, introduction and theme pages moved
  // onto viewer-layout's composed views (metanull/islamicart#45) over
  // `useCollectionTree`: `SectionCards` for the entrance and the splash's
  // theme list, `EssayView` for the introduction (an `about` page) and a
  // theme's pages (the narrative, the tab strip, the picture panel, and
  // previous/next walking the whole exhibition — decision D2).
  function findExhibitionThemeWithPages() {
    // Not every theme has more than one page; the tab strip (asserted
    // below) only renders past one, so this hunts for one that does rather
    // than assuming the first exhibition's first theme is that one.
    for (const exhibition of collectionsFixture.filter((c) => c.parent_id === exhibitionsRoot.id)) {
      for (const theme of collectionsFixture.filter((c) => c.parent_id === exhibition.id)) {
        const pages = collectionsFixture.filter((c) => c.parent_id === theme.id)
        if (pages.length > 1) return { exhibition, theme }
      }
    }
    return null
  }

  let collectionsFixture
  let exhibitionsRoot

  it('renders the Exhibitions entrance on SectionCards', async () => {
    ;[collectionsFixture] = await loadEntities(['collections'])
    exhibitionsRoot = collectionsFixture.find((c) => c.purpose === 'exhibitions-root')
    expect(exhibitionsRoot).toBeTruthy()

    const { app, host } = await mountSite('#/exhibitions')
    await vi.waitFor(() => expect(host.querySelector('.mwnf-cards')).not.toBeNull(), { timeout: 20000 })
    expect(host.querySelector('.section-heading').textContent).toContain('Exhibitions')
    app.unmount()
  }, 30000)

  it('renders an exhibition theme on the composed essay view, with its panel and navigation (previous/next, no tab strip)', async () => {
    const { exhibition, theme } = findExhibitionThemeWithPages()
    const { app, host } = await mountSite(`#/exhibitions/${exhibition.id}/theme/${theme.id}`)
    await vi.waitFor(() => expect(host.querySelector('.mwnf-essay')).not.toBeNull(), { timeout: 20000 })
    expect(host.querySelector('.mwnf-essay__tabs')).toBeNull()
    expect(host.querySelector('.mwnf-essay__nav-link')).not.toBeNull()
    expect(host.querySelector('.mwnf-essay__panel')).not.toBeNull()
    expect(host.querySelector('.mwnf-essay-nav, .mwnf-essay__nav')).not.toBeNull()

    // `panel.variants` (metanull/viewer-layout#49, islamicart#57): the panel
    // opens on the first item's own image with its name as the panel's
    // title; where that item carries curated "detail" close-ups
    // (`entry.details`), a second thumbnail is offered and swaps the whole
    // caption — title, justification and fields together, not just the
    // picture — when picked.
    const panelName = host.querySelector('.mwnf-essay__panel-name')
    expect(panelName).not.toBeNull()
    expect(panelName.textContent.trim()).not.toBe('')

    const activePage = collectionsFixture.find((c) => c.parent_id === theme.id)
    const firstItemEntry = activePage?.items?.[0]
    if ((firstItemEntry?.details ?? []).length > 0) {
      const variants = host.querySelectorAll('.mwnf-essay__variant')
      expect(variants.length).toBeGreaterThan(1)
      const initialName = panelName.textContent
      variants[1].click()
      await vi.waitFor(() => expect(host.querySelector('.mwnf-essay__panel-name').textContent).not.toBe(initialName))
    }

    // viewer-core 1.12.1 exposes tree.entity, so EssayView reads the theme's
    // translated title from the collections entity, not the internal_name.
    // The view reads these texts through the tree's own entity, and a wrong
    // entity renders internal names silently.
    const { default: collectionsTranslations } = await import('@metanull/islamicart-data/translations/collections.en.json', { assert: { type: 'json' } })
    const themeTranslation = collectionsTranslations[theme.id]
    const essayTitle = host.querySelector('.mwnf-essay__title')
    expect(essayTitle?.textContent.trim()).toBe(themeTranslation?.title ?? theme.internal_name)
    expect(essayTitle?.textContent.trim()).not.toBe(theme.internal_name)
    const essayBody = host.querySelector('.mwnf-essay__body, .mwnf-essay__prose')
    if (themeTranslation?.description) {
      expect(essayBody?.textContent.trim().length).toBeGreaterThan(0)
    }

    app.unmount()
  }, 30000)

  it('renders an exhibition introduction as an about essay', async () => {
    const withIntro = collectionsFixture.find((c) => c.parent_id === exhibitionsRoot.id && (c.items?.length ?? 0) > 0)
    expect(withIntro).toBeTruthy()

    const { app, host } = await mountSite(`#/exhibitions/${withIntro.id}/introduction`)
    await vi.waitFor(() => expect(host.querySelector('.mwnf-essay')).not.toBeNull(), { timeout: 20000 })
    expect(host.querySelector('.mwnf-essay--about')).not.toBeNull()
    app.unmount()
  }, 30000)

  // The Artistic Introduction entrance and theme pages moved onto
  // viewer-layout's composed views (islamicart#46), the same way Exhibitions
  // did: `TextPageView` (its `body(ctx)`, metanull/viewer-layout#49) for the
  // entrance's own text plus `SectionCards` for the theme list, `EssayView`
  // for a theme's pages — `tabs: true`, `navigation: 'siblings'` (legacy
  // never walked from one theme into the next here, unlike Exhibitions).
  function findArtIntroThemeWithPages() {
    for (const theme of collectionsFixture.filter((c) => c.parent_id === artIntroRootFixture.id)) {
      const pages = collectionsFixture.filter((c) => c.parent_id === theme.id)
      if (pages.length > 1) return theme
    }
    return null
  }

  let artIntroRootFixture

  it('renders the Artistic Introduction entrance on TextPageView and SectionCards', async () => {
    const marker = collectionsFixture.find((c) => c.purpose === 'artistic-introduction-root')
    expect(marker).toBeTruthy()
    artIntroRootFixture = collectionsFixture.find((c) => c.parent_id === marker.id)
    expect(artIntroRootFixture).toBeTruthy()

    const { app, host } = await mountSite('#/artistic-introduction')
    await vi.waitFor(() => expect(host.querySelector('.mwnf-text-page')).not.toBeNull(), { timeout: 20000 })
    expect(host.querySelector('.section-heading').textContent).toContain('Artistic Introduction')
    expect(host.querySelector('.mwnf-cards')).not.toBeNull()
    app.unmount()
  }, 30000)

  it('renders an Artistic Introduction theme on the composed essay view, with its tab strip and panel', async () => {
    const theme = findArtIntroThemeWithPages()
    expect(theme).toBeTruthy()

    const { app, host } = await mountSite(`#/artistic-introduction/${theme.id}`)
    await vi.waitFor(() => expect(host.querySelector('.mwnf-essay')).not.toBeNull(), { timeout: 20000 })
    expect(host.querySelector('.mwnf-essay__tabs')).not.toBeNull()
    expect(host.querySelector('.mwnf-essay__panel')).not.toBeNull()

    const panelName = host.querySelector('.mwnf-essay__panel-name')
    expect(panelName).not.toBeNull()
    expect(panelName.textContent.trim()).not.toBe('')

    // viewer-core 1.12.1 exposes tree.entity, so EssayView reads the theme's
    // translated title from the collections entity, not the internal_name.
    // The view reads these texts through the tree's own entity, and a wrong
    // entity renders internal names silently.
    const { default: collectionsTranslations } = await import('@metanull/islamicart-data/translations/collections.en.json', { assert: { type: 'json' } })
    const themeTranslation = collectionsTranslations[theme.id]
    const essayTitle = host.querySelector('.mwnf-essay__title')
    expect(essayTitle?.textContent.trim()).toBe(themeTranslation?.title ?? theme.internal_name)
    expect(essayTitle?.textContent.trim()).not.toBe(theme.internal_name)
    const essayBody = host.querySelector('.mwnf-essay__body, .mwnf-essay__prose')
    if (themeTranslation?.description) {
      expect(essayBody?.textContent.trim().length).toBeGreaterThan(0)
    }

    app.unmount()
  }, 30000)

  it('declares every route by name, and leaves the catch-all to the router', () => {
    const names = config.extraViews.map((r) => r.name)
    for (const name of [
      'home', 'permanent-collection', 'permanent-collection-results', 'database', 'database-results',
      'timeline', 'timeline-results', 'partners', 'partners-results', 'partner', 'dynasties',
      'dynasty', 'artistic-introduction', 'artistic-introduction-theme', 'exhibitions', 'exhibition',
      'exhibition-introduction', 'exhibition-theme', 'item',
    ]) {
      expect(names).toContain(name)
    }
    expect(config.extraViews.every((r) => r.name)).toBe(true)
    expect(config.extraViews.some((r) => r.path.includes('pathMatch'))).toBe(false)
    // This website has never been published under another URL shape.
    expect(config.legacyRoutes).toEqual([])
  })

  it('declares the entities every route reads', () => {
    // A view that renders records against `null` is the failure this prevents:
    // the router loads what a route names before the view is created.
    for (const route of config.extraViews) {
      expect(Array.isArray(route.meta?.entities), route.name).toBe(true)
    }
    expect(config.extraViews.find((r) => r.name === 'item').meta.entities).toContain('items')
  })

  it('declares the section every route belongs to', () => {
    // The menu highlights the current section by reading `meta.section`
    // (viewer-core's `useSection()`); a route without one leaves the menu
    // with nothing active.
    for (const route of config.extraViews) {
      expect(typeof route.meta?.section, route.name).toBe('string')
      expect(route.meta.section, route.name).not.toBe('')
    }
  })

  // The record lookups are viewer-core's shared indexes now, and a Map is not
  // an object: `byId(...)[id]` reads as undefined rather than failing, so a
  // page would simply render nothing. This is where that shows.
  it('resolves a record through the shared index', async () => {
    const { loadEntities } = await import('@metanull/viewer-core')
    const { itemById } = useInventoryData()
    const [items] = await loadEntities(['items'])
    expect(itemById.value).toBeInstanceOf(Map)
    expect(itemById.value.get(items[0].id)).toBe(items[0])
  }, 20000)

  it('offers the languages the package declares for the site, where the items carry them', () => {
    expect(checkOfferedLanguages(config)).toEqual([])
    expect(config.languages).toContain('en')
    // Languages declared in the manifest but with zero translation files
    // (fa, he, ru, ch as of data package 1.0.26) must not be offered.
    for (const phantom of ['fa', 'he', 'ru', 'ch']) {
      expect(config.languages).not.toContain(phantom)
    }
    // Labels resolve to real language names where the package declares one.
    const switcher = config.navigation.languages
    expect(switcher.map((l) => l.code)).toEqual(config.languages)
    expect(switcher.every((l) => Boolean(l.label))).toBe(true)
  })

  // The chrome is now two layers, and either one failing is silent: a missing
  // entry renders as its own name rather than as an error. These assert the
  // rendered page, not the files, so a bundle that installs but never reaches
  // the components fails here too.
  it('renders the shared texts and its own over them', async () => {
    const { app, host } = await mountSite()

    const text = host.textContent
    // From viewer-i18n: the layout's skip link and the menu's first entry.
    expect(text).toContain('Skip to content')
    expect(text).toContain('Home')
    // From locales/en.json: the header lockup, a menu entry, the footer.
    expect(text).toContain('Museum With No Frontiers')
    expect(text).toContain('Permanent Collection')
    expect(text).toContain('Welcome to Islamic Art')
    // Nothing rendered as a bare entry name, which is what a missing text
    // looks like — there is no exception to throw for one.
    expect(text).not.toMatch(/\b(islamicart|core|layout)\.[a-z]/i)

    app.unmount()
  }, 20000)
})
