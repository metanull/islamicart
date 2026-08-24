import languagesData from '@inventory-data/languages.json'
import SiteShell from './SiteShell.vue'

// Content languages = every language that actually has at least one
// translation file in the data package (the manifest over-declares languages
// that have no content at all). English first, the rest alphabetical.
const translationFiles = import.meta.glob('@inventory-data/translations/*.json')
const translatedLangs = new Set(
  Object.keys(translationFiles)
    .map((path) => path.match(/\.([a-z]{2})\.json$/)?.[1])
    .filter(Boolean),
)
const languages = [
  ...(translatedLangs.has('en') ? ['en'] : []),
  ...[...translatedLangs].filter((l) => l !== 'en').sort(),
]

// Native display name for the language switcher, from the data package's
// language table (falls back to the English name, then the raw code).
function languageLabel(code) {
  const row = languagesData.find((l) => l.code === code)
  return row?.names?.[code] ?? row?.names?.en ?? code.toUpperCase()
}

export default {
  // The dataset package this website renders. Must match the alias in
  // vite.config.js and the dependency in package.json.
  datasetPackage: '@metanull/islamicart-data',

  siteName: 'Islamic Art',

  // All pages are website-specific views (below) — no generic entity pages.
  features: {
    entities: [],
  },

  // vue-i18n locale doubles as the content language; 'en' first so it is the
  // initial locale.
  languages,

  shell: SiteShell,
  navigation: {
    navLinks: [
      { label: 'Home', href: '#/' },
      { label: 'Permanent Collection', href: '#/permanent-collection' },
      { label: 'Database', href: '#/database' },
      { label: 'Timeline', href: '#/timeline' },
      { label: 'Partners', href: '#/partners' },
      { label: 'Dynasties', href: '#/dynasties' },
      { label: 'Artistic Introduction', href: '#/artistic-introduction' },
      { label: 'Exhibitions', href: '#/exhibitions' },
    ],
    languages: languages.map((code) => ({ code, label: languageLabel(code) })),
    footerText: '© Museum With No Frontiers (MWNF) 2004 – 2026',
  },

  // The full legacy route map, one view per page. The 'home' name replaces
  // viewer-core's generic home route.
  extraViews: [
    { path: '/', name: 'home', component: () => import('./views/Home.vue') },
    { path: '/permanent-collection', component: () => import('./views/PcEntrance.vue') },
    { path: '/permanent-collection/results', component: () => import('./views/PcList.vue') },
    { path: '/database', component: () => import('./views/Database.vue') },
    { path: '/database/results', component: () => import('./views/DatabaseResults.vue') },
    { path: '/timeline', component: () => import('./views/TimelineEntrance.vue') },
    { path: '/timeline/results', component: () => import('./views/TimelineResults.vue') },
    { path: '/partners', component: () => import('./views/PartnersEntrance.vue') },
    { path: '/partners/results', component: () => import('./views/PartnersResults.vue') },
    { path: '/partner/:id', component: () => import('./views/PartnerDetail.vue') },
    { path: '/dynasties', component: () => import('./views/Dynasties.vue') },
    { path: '/dynasty/:id', component: () => import('./views/DynastyDetail.vue') },
    { path: '/artistic-introduction', component: () => import('./views/ArtIntroEntrance.vue') },
    { path: '/artistic-introduction/:themeId', component: () => import('./views/ArtIntroTheme.vue') },
    { path: '/exhibitions', component: () => import('./views/ExhibitionsEntrance.vue') },
    { path: '/exhibitions/:exhibitionId', component: () => import('./views/ExhibitionSplash.vue') },
    {
      path: '/exhibitions/:exhibitionId/introduction',
      component: () => import('./views/ExhibitionIntroduction.vue'),
    },
    {
      path: '/exhibitions/:exhibitionId/theme/:themeId',
      component: () => import('./views/ExhibitionTheme.vue'),
    },
    { path: '/item/:id', component: () => import('./views/ItemDetail.vue') },
  ],
}
