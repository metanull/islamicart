import { describe, expect, it } from 'vitest'
import { createViewer, mergeMessages } from '@metanull/viewer-core'
import { catalogues as sharedTexts } from '@metanull/viewer-i18n/standalone'
import ownTexts from '../locales/en.json'
import config from '../src/dataset.config.js'

// The same two layers main.js assembles, in the same order: the shared bundle
// first, this website's own file last. Mounting without them would prove
// nothing about the chrome — every text would render as its own name.
const messages = mergeMessages(sharedTexts, { en: ownTexts })

describe('website smoke test', () => {
  it('mounts against the configured data package', async () => {
    window.location.hash = '#/'
    const app = createViewer({ ...config, messages })
    const host = document.createElement('div')
    document.body.appendChild(host)
    app.mount(host)
    await app.config.globalProperties.$router.isReady()

    expect(host.textContent).toContain(config.siteName)
    expect(host.querySelector('.mwnf-page')).not.toBeNull()

    // The website's own Home view (registered under the route name 'home')
    // must replace viewer-core's generic home view.
    expect(host.querySelector('.vc-home')).toBeNull()

    app.unmount()
  })

  it('declares every legacy route', () => {
    const paths = config.extraViews.map((r) => r.path)
    for (const path of [
      '/',
      '/permanent-collection',
      '/permanent-collection/results',
      '/database',
      '/database/results',
      '/timeline',
      '/timeline/results',
      '/partners',
      '/partners/results',
      '/partner/:id',
      '/dynasties',
      '/dynasty/:id',
      '/artistic-introduction',
      '/artistic-introduction/:themeId',
      '/exhibitions',
      '/exhibitions/:exhibitionId',
      '/exhibitions/:exhibitionId/introduction',
      '/exhibitions/:exhibitionId/theme/:themeId',
      '/item/:id',
    ]) {
      expect(paths).toContain(path)
    }
  })

  it('offers only languages that have content', () => {
    expect(config.languages).toContain('en')
    // The order is the switcher's, not the opening language's: viewer-core
    // negotiates that, so nothing may depend on English being first again.
    expect([...config.languages].sort()).toEqual(config.languages)
    // Languages declared in the manifest but with zero translation files
    // (fa, he, ru, ch as of data package 1.0.26) must not be offered.
    for (const phantom of ['fa', 'he', 'ru', 'ch']) {
      expect(config.languages).not.toContain(phantom)
    }
    const switcher = config.navigation.languages
    expect(switcher.map((l) => l.code)).toEqual(config.languages)
    // Labels resolve to real language names where the language table has one.
    expect(switcher.find((l) => l.code === 'fr').label).toBe('Français')
  })

  // The chrome is now two layers, and either one failing is silent: a missing
  // entry renders as its own name rather than as an error. These assert the
  // rendered page, not the files, so a bundle that installs but never reaches
  // the components fails here too.
  it('renders the shared texts and its own over them', async () => {
    window.location.hash = '#/'
    const app = createViewer({ ...config, messages })
    const host = document.createElement('div')
    document.body.appendChild(host)
    app.mount(host)
    await app.config.globalProperties.$router.isReady()

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
  })
})
