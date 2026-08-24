import { describe, expect, it } from 'vitest'
import { createViewer } from '@metanull/viewer-core'
import config from '../src/dataset.config.js'

describe('website smoke test', () => {
  it('mounts against the configured data package', async () => {
    window.location.hash = '#/'
    const app = createViewer(config)
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

  it('offers only languages that have content, English first', () => {
    expect(config.languages[0]).toBe('en')
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
})
