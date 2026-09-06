<script setup>
import { computed } from 'vue'
import { I18nText, useFeaturedRecord, useI18n } from '@metanull/viewer-core'
import { FeaturedRecord, SectionCards } from '@metanull/viewer-layout/content'
import { useInventoryData } from '../composables/useInventoryData.js'

// The landing page: the welcome, the seven sections as cards, and one item
// on display. The pick and the grid are the platform's; which sections, in
// what words, is this website's — every text written out so the check that
// every name resolves can read it.

const { t } = useI18n()
const { itemLabel, mdInline, tr } = useInventoryData()

const cards = computed(() => [
  { title: t('islamicart.nav.permanentCollection'), description: t('islamicart.home.permanentCollectionText'), action: t('core.action.browse'), to: { name: 'permanent-collection' } },
  { title: t('islamicart.nav.database'), description: t('islamicart.home.databaseText'), action: t('core.action.search'), to: { name: 'database' } },
  { title: t('islamicart.nav.timeline'), description: t('islamicart.home.timelineText'), action: t('core.action.explore'), to: { name: 'timeline' } },
  { title: t('islamicart.nav.partners'), description: t('islamicart.home.partnersText'), action: t('core.action.browse'), to: { name: 'partners' } },
  { title: t('islamicart.dynasty.heading'), description: t('islamicart.home.dynastiesText'), action: t('core.action.explore'), to: { name: 'dynasties' } },
  { title: t('islamicart.nav.artisticIntroduction'), description: t('islamicart.home.artisticIntroductionText'), action: t('core.action.explore'), to: { name: 'artistic-introduction' } },
  { title: t('islamicart.nav.exhibitions'), description: t('islamicart.home.exhibitionsText'), action: t('core.action.explore'), to: { name: 'exhibitions' } },
])

// One item with an image, picked once per visit.
const featured = useFeaturedRecord('items')
const featuredText = computed(() => (featured.value ? tr('items', featured.value.id) : {}))
</script>

<template>
  <div class="home">
    <div class="home-banner content-box">
      <h1 class="home-title">{{ $t('islamicart.home.title') }}</h1>
      <I18nText tag="p" class="home-intro" keypath="islamicart.home.intro" />
    </div>

    <SectionCards :cards="cards" />

    <FeaturedRecord
      v-if="featured"
      class="content-box"
      :heading="$t('islamicart.home.itemOnDisplay')"
      :image="featured.images?.[0]?.url ?? ''"
      :image-alt="itemLabel(featured)"
      :eyebrow="featured.type"
      :name="mdInline(featuredText.name ?? featured.internal_name ?? featured.id)"
      :meta="[featuredText.location, featuredText.dates].filter(Boolean)"
      :action="$t('core.action.viewDetails')"
      :to="{ name: 'item', params: { id: featured.id } }"
    />
  </div>
</template>

<style scoped>
.home { display: flex; flex-direction: column; gap: 16px; }
.home-banner { border-top: 3px solid var(--accent-dark); }
.home-title {
  font-size: 20px;
  font-weight: 400;
  color: var(--heading);
  margin-bottom: 10px;
}
.home-intro {
  font-size: 14px;
  line-height: 1.7;
  color: var(--text);
  max-width: 680px;
}
</style>
