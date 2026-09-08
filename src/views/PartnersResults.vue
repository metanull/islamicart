<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from '@metanull/viewer-core'
import { PartnerListView } from '@metanull/viewer-layout/views'
import { partnersResults } from '../composables/partner.js'

// The partner results page is the platform's composed partner list,
// rendering the spec in composables/partner.js. What is this website's is
// the heading — the type and project the entrance's own link chose — and
// the toggle between museums and institutions.

const route = useRoute()
const { t } = useI18n()

const filterType = computed(() => (route.query.type === 'institution' ? 'institution' : 'museum'))
const otherType = computed(() => (filterType.value === 'museum' ? 'institution' : 'museum'))

// 'ISL' (Discover Islamic Art) and 'EPM' (Explore Islamic Art Collections)
// are two entirely separate curated lists in legacy — never merged into one,
// unlike Permanent Collection/Database.
const project = computed(() => (route.query.project === 'EPM' ? 'EPM' : 'ISL'))

const spec = computed(() => partnersResults(filterType.value, project.value))

// Both branches spell their own name in full, for the same reason the spec
// factory's do.
const typeHeading = computed(() =>
  filterType.value === 'museum' ? t('partner.list.museums') : t('partner.list.institutions')
)
const projectLabel = computed(() =>
  project.value === 'EPM' ? t('islamicart.project.explore') : t('islamicart.project.discover')
)
const otherTypeLabel = computed(() =>
  otherType.value === 'museum' ? t('islamicart.partner.viewMuseums') : t('islamicart.partner.viewInstitutions')
)
</script>

<template>
  <div>
    <RouterLink to="/partners" class="mwnf-back-bar">‹ {{ $t('partner.nav.back') }}</RouterLink>

    <h1 class="mwnf-heading">
      {{ typeHeading }}
      <span class="heading-project"> — {{ projectLabel }}</span>
    </h1>

    <div class="mwnf-panel">
      <p class="other-type">
        <RouterLink :to="{ path: '/partners/results', query: { type: otherType, project } }">
          {{ otherTypeLabel }}
        </RouterLink>
      </p>

      <PartnerListView :spec="spec" />
    </div>
  </div>
</template>

<style scoped>
.heading-project { font-weight: normal; font-size: 14px; color: var(--muted); }

.other-type {
  font-family: 'Roboto', sans-serif;
  font-size: 12px;
  color: var(--muted);
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border);
}
</style>
