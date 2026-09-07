<script setup>
import { watch } from 'vue'
import { useRoute } from 'vue-router'
import { CatalogueResultsView } from '@metanull/viewer-layout/views'
import { useInventoryData } from '../composables/useInventoryData.js'
import { useSearchFields } from '../composables/catalogue.js'
import { databaseResults } from '../composables/search.js'

// The database results is the platform's composed catalogue results view,
// rendering the spec in composables/search.js. What is this website's is
// the heading, the search-language translations watch (a side effect the
// spec itself has no lifecycle to run), and the refine row's field/operator
// selects — not a record facet the view can derive options for itself.

const route = useRoute()
const { loadTranslations } = useInventoryData()
const fieldOptions = useSearchFields()

// The search language is read straight off the URL, not the composed
// view's own staged filters, so a language chosen on the entrance loads
// before this page's first render rather than after an Apply click.
watch(() => route.query.lang, (lang) => { if (lang) loadTranslations('items', lang) }, { immediate: true })
</script>

<template>
  <div>
    <h1 class="section-heading">{{ $t('islamicart.nav.database') }} — {{ $t('catalogue.results.heading') }}</h1>

    <div class="content-box">
      <CatalogueResultsView :spec="databaseResults">
        <template #actions>
          <RouterLink :to="{ name: 'database' }" class="btn btn-secondary small">{{ $t('catalogue.search.newSearch') }}</RouterLink>
        </template>

        <template #filters="{ filters }">
          <select v-model="filters.field4" class="field">
            <option v-for="f in fieldOptions" :key="f.value" :value="f.value">{{ f.label }}</option>
          </select>
          <select v-model="filters.op4" class="cond">
            <option value="AND">{{ $t('catalogue.search.and') }}</option>
            <option value="OR">{{ $t('catalogue.search.or') }}</option>
          </select>
        </template>

        <template #empty>
          {{ $t('catalogue.results.noResultsSearch') }}
          <RouterLink :to="{ name: 'database' }">{{ $t('catalogue.search.tryNewSearch') }}</RouterLink>
        </template>
      </CatalogueResultsView>
    </div>
  </div>
</template>

<style scoped>
.btn.small { font-size: 12px; padding: 4px 12px; text-decoration: none; }
.field { width: 200px; }
.cond { width: 60px; margin-left: 8px; }
</style>
