<script setup>
import { useRoute } from 'vue-router'
import { useI18n } from '@metanull/viewer-core'
import { TimelineResultsView } from '@metanull/viewer-layout/views'
import { useInventoryData } from '../composables/useInventoryData.js'
import { timelineResults } from '../composables/timeline.js'

// The timeline results is the platform's composed timeline view, rendering
// the results spec in composables/timeline.js. What is this website's is
// the heading — the section's name with the active filter as a suffix,
// which legacy printed and no other website does — and the way back to the
// entrance.

const route = useRoute()
const { t } = useI18n()
const { countryLabel } = useInventoryData()

// Null when nothing is filtered, so the suffix depends on the absence of a
// filter rather than on a comparison against a text that changes with the
// language.
function activeFilterLabel() {
  const { country, begin, end } = route.query
  const parts = []
  if (country && country !== 'all') parts.push(countryLabel(country))
  if (begin) parts.push(`${t('catalogue.filter.from')} ${begin}`)
  if (end) parts.push(`${t('catalogue.filter.to')} ${end}`)
  return parts.length ? parts.join(' — ') : null
}
</script>

<template>
  <div>
    <RouterLink to="/timeline" class="back-link">‹ {{ $t('timeline.nav.backLink') }}</RouterLink>

    <h1 class="section-heading">
      {{ $t('islamicart.nav.timeline') }}
      <span v-if="activeFilterLabel()" class="heading-filter"> — {{ activeFilterLabel() }}</span>
    </h1>

    <div class="content-box">
      <TimelineResultsView :spec="timelineResults" />
    </div>
  </div>
</template>

<style scoped>
.heading-filter { font-weight: normal; font-size: 14px; color: var(--muted); }
</style>
