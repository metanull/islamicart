<script setup>
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from '@metanull/viewer-core'
import { CatalogueResultsView } from '@metanull/viewer-layout/views'
import { useInventoryData } from '../composables/useInventoryData.js'
import { timelineGallery } from '../composables/timeline.js'

// Decision D1: the timeline gallery of objects legacy served from
// `hcr_gallery.php`, regained as the platform's composed results page,
// rendering the spec in composables/timeline.js. What is this website's is
// the heading — the section's name with the country/period it was reached
// with — and the way back to the timeline results that linked here.

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const { countryLabel } = useInventoryData()

function activeFilterLabel() {
  const { country, begin, end } = route.query
  const parts = []
  if (country && country !== 'all') parts.push(countryLabel(country))
  if (begin) parts.push(`${t('catalogue.filter.from')} ${begin}`)
  if (end) parts.push(`${t('catalogue.filter.to')} ${end}`)
  return parts.length ? parts.join(' — ') : null
}

// Reached only from the timeline results' "See gallery" link, never a nav
// entry of its own, the way the item sheet's back link also prefers history
// over a fixed target.
function back() {
  if (window.history.length > 2) router.back()
  else router.push({ name: 'timeline-results', query: route.query })
}
</script>

<template>
  <div>
    <a class="back-link" href="#" @click.prevent="back">‹ {{ $t('timeline.nav.backLink') }}</a>

    <h1 class="section-heading">
      {{ $t('timeline.results.galleryHeading') }}
      <span v-if="activeFilterLabel()" class="heading-filter"> — {{ activeFilterLabel() }}</span>
    </h1>

    <CatalogueResultsView :spec="timelineGallery" class="timeline-gallery" />
  </div>
</template>

<style scoped>
.heading-filter { font-weight: normal; font-size: 14px; color: var(--muted); }
.timeline-gallery :deep(.mwnf-catalogue__filters) { margin-bottom: 16px; }
.timeline-gallery :deep(.mwnf-catalogue__body) {
  background: var(--content-bg);
  border: 1px solid var(--border);
  padding: 20px;
  margin-bottom: 16px;
}
</style>
