<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { timelineLinkFor } from '@metanull/viewer-core'
import { DynastyList, MediaGallery, RecordLanguages, SheetSection } from '@metanull/viewer-layout/content'
import { RecordView } from '@metanull/viewer-layout/views'
import { useInventoryData } from '../composables/useInventoryData.js'
import { artIntroLinksForItem } from '../composables/artIntro.js'
import { exhibitionLinksForItem } from '../composables/exhibitions.js'
import { itemSheet } from '../composables/sheet.js'

// The item sheet is the platform's composed record page, rendering the spec
// in composables/sheet.js. What is this website's fills the page's slots:
// the header — the way back, the timeline link, the type badge — and, after
// the sheet, the blocks only Islamic Art has: a monument's special features,
// the related media, the dynasty cards, the Artistic Introduction links, the
// exhibitions the item is on display in, the THG galleries.

defineProps({ id: { type: String, required: true } })

const router = useRouter()
const { dynasties, items, md, mdInline, tr } = useInventoryData()

function back() {
  if (window.history.length > 2) router.back()
  else router.push('/')
}

const timelineLink = (record) => timelineLinkFor(record, { name: 'timeline-results' })

// A monument's sub-details are child items of type `detail`.
const detailsByParent = computed(() => {
  const map = new Map()
  for (const item of items.value ?? []) {
    if (item.type !== 'detail' || !item.parent_id) continue
    if (!map.has(item.parent_id)) map.set(item.parent_id, [])
    map.get(item.parent_id).push(item)
  }
  for (const list of map.values()) list.sort((a, b) => (a.display_order ?? 9999) - (b.display_order ?? 9999))
  return map
})
const monumentDetails = (record) => detailsByParent.value.get(record.id) ?? []
const detailText = (detail, language) => tr('items', detail.id, language)

// Related media: the active language first, any language otherwise.
function relatedMedia(record, language) {
  const all = record.media ?? []
  const inLang = all.filter((m) => m.language === language)
  return inLang.length ? inLang : all
}

// Decision D5: the dynasty popout — legacy's `dynasty.php` popup, and the
// DXA sites' own shape — replaces this website's dynasty cards and the
// standalone dynasty list/sheet the popout regains only ever needed to
// exist for. `DynastyList` reads the record's own dynasties and resolves
// each one's translation itself, through `tr` below.
const dynastyById = computed(() => new Map((dynasties.value ?? []).map((d) => [d.id, d])))
function itemDynasties(record) {
  return (record.dynasty_ids ?? []).map((id) => dynastyById.value.get(id)).filter(Boolean)
}

const artIntroLinks = (record) =>
  artIntroLinksForItem(record.id).map((l) => ({
    label: l.label,
    to: { name: 'artistic-introduction-theme', params: { themeId: l.themeId } },
  }))

const onDisplayInLinks = (record) =>
  exhibitionLinksForItem(record.id).map((l) => ({
    label: l.label,
    to: l.themeId
      ? { name: 'exhibition-theme', params: { exhibitionId: l.exhibitionId, themeId: l.themeId } }
      : { name: 'exhibition-introduction', params: { exhibitionId: l.exhibitionId } },
  }))

// THG is due for a rewrite; these stay same-page anchors, not addresses.
const thgGalleryLinks = (record) =>
  (record.thg_galleries ?? []).map((g) => ({ name: g.name, href: `#ThematicGallery-${g.name}` }))
</script>

<template>
  <RecordView :spec="itemSheet" :id="id" class="detail mwnf-panel">
    <template #header="{ record, text, language, languages, select, dir, glossary }">
      <div class="detail-top">
        <a class="mwnf-back-bar" href="#" @click.prevent="back">← {{ $t('record.action.backToResults') }}</a>
        <router-link v-if="timelineLink(record)" :to="timelineLink(record)" class="mwnf-back-bar">{{ $t('record.action.viewOnTimeline') }} →</router-link>
      </div>
      <!-- In a block of its own: the view lays the header out as a column,
           and a badge placed directly in it would stretch to the full width. -->
      <div><span class="detail-type-badge">{{ record.type }}</span></div>
      <RecordLanguages :languages="languages" :language="language" @select="select" />
      <h1 class="detail-title" :dir="dir" v-html="mdInline(text.name ?? record.internal_name ?? record.id, { glossary })"></h1>
    </template>

    <template #after-sheet="{ record, language, dir, glossary }">
      <!-- Special features: a monument's sub-details -->
      <SheetSection v-if="monumentDetails(record).length" :heading="$t('sheet.field.specialFeatures')" :dir="dir">
        <div v-for="d in monumentDetails(record)" :key="d.id" class="special-feature">
          <h3 class="special-feature-name" v-html="mdInline(detailText(d, language).name ?? d.internal_name ?? d.id)"></h3>
          <p v-if="detailText(d, language).location" class="special-feature-meta">{{ detailText(d, language).location }}</p>
          <p v-if="detailText(d, language).dates" class="special-feature-meta">{{ detailText(d, language).dates }}</p>
          <p v-if="d.artist_names?.length" class="special-feature-meta">{{ d.artist_names.join(', ') }}</p>
          <div v-if="detailText(d, language).description" class="mwnf-sheet__block" v-html="md(detailText(d, language).description, { glossary })"></div>
          <MediaGallery v-if="d.images?.length" :images="d.images.map((img) => ({ url: img.url, alt: img.captions?.[language] ?? '' }))" variant="row" />
        </div>
      </SheetSection>

      <SheetSection v-if="relatedMedia(record, language).length" :heading="$t('record.related.video')">
        <div v-for="(m, i) in relatedMedia(record, language)" :key="i" class="media-entry">
          <a :href="m.url" target="_blank" rel="noopener" class="media-title">{{ m.title }}</a>
          <p v-if="m.description" class="media-description">{{ m.description }}</p>
        </div>
      </SheetSection>

      <DynastyList
        v-if="itemDynasties(record).length"
        :heading="$t('sheet.field.dynasties')"
        :dynasties="itemDynasties(record)"
        :tr="(d) => tr('dynasties', d.id, language)"
        :dir="dir"
      />

      <SheetSection v-if="artIntroLinks(record).length" :heading="$t('islamicart.nav.artisticIntroduction')">
        <ul class="link-list">
          <li v-for="l in artIntroLinks(record)" :key="l.to.params.themeId">
            <router-link :to="l.to"><span v-html="mdInline(l.label)"></span></router-link>
          </li>
        </ul>
      </SheetSection>

      <SheetSection v-if="onDisplayInLinks(record).length" :heading="$t('record.related.onDisplayIn')">
        <ul class="link-list">
          <li v-for="(l, i) in onDisplayInLinks(record)" :key="i">
            <router-link :to="l.to"><span v-html="mdInline(l.label)"></span></router-link>
          </li>
        </ul>
      </SheetSection>

      <SheetSection v-if="thgGalleryLinks(record).length" :heading="$t('record.related.galleries')">
        <ul class="link-list">
          <li v-for="g in thgGalleryLinks(record)" :key="g.name"><a :href="g.href">{{ g.name }}</a></li>
        </ul>
      </SheetSection>
    </template>
  </RecordView>
</template>

<style scoped>
.detail-top { display: flex; justify-content: space-between; gap: 10px; margin-bottom: 10px; }

.detail-type-badge {
  display: inline-block;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--heading);
  border: 1px solid var(--accent-dark);
  padding: 2px 8px;
  margin-bottom: 10px;
}

.detail-title {
  font-size: 24px;
  font-weight: 400;
  color: var(--heading);
  margin: 10px 0 16px;
  line-height: 1.3;
}

.detail :deep(.mwnf-media) { margin-bottom: 20px; }
.detail :deep(.mwnf-sheet) { margin-bottom: 20px; }

/* Special features */
.special-feature { margin-bottom: 16px; }
.special-feature-name { font-size: 15px; font-weight: 500; color: var(--heading); margin-bottom: 4px; }
.special-feature-meta { font-size: 12px; color: var(--muted); margin: 0 0 4px; }

/* Related media */
.media-entry { margin-bottom: 10px; }
.media-title { font-size: 13px; font-weight: 500; color: var(--nav-active); }
.media-description { font-size: 12px; color: var(--muted); margin: 2px 0 0; }

/* Link lists */
.link-list { list-style: none; font-size: 13px; padding: 0; margin: 0; }
.link-list a { color: var(--nav-active); }
</style>
