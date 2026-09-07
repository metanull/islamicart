<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { renderBlock } from '@metanull/viewer-core'
import { EssayView } from '@metanull/viewer-layout/views'
import { exhibitionTree } from '../composables/exhibitions.js'
import { exhibitionIntroductionSpec } from '../composables/exhibitionSpecs.js'
import { useInventoryData } from '../composables/useInventoryData.js'

// The exhibition's introduction: not a theme, so it renders as an `about`
// essay over the exhibition node itself — its own `extra.intro_header` /
// `extra.intro_text`, read directly rather than through `spec.quote`/`body`
// (both fields of the node's *translation*, not of a nested `extra`, which
// `EssayView` has no way to reach — see the pull request description) — plus
// the items attached to the exhibition collection directly.
const route = useRoute()
const router = useRouter()
const { dynastyLabel, partnerLabel, tr } = useInventoryData()

const exhibitionId = computed(() => decodeURIComponent(route.params.exhibitionId))
// A new exhibition id is a new tree (`EssayView` reads `spec.tree` once, at
// setup); `:key` below forces the remount that keeps it in step.
const tree = exhibitionTree(exhibitionId.value)
const spec = exhibitionIntroductionSpec(tree)
const exhibitionTitle = computed(() => {
  const e = tree.root.value
  return e ? (tr('collections', e.id).title ?? e.internal_name) : ''
})

function back() {
  if (window.history.length > 2) router.back()
  else router.push(`/exhibitions/${exhibitionId.value}`)
}

function itemMeta(item, node, language) {
  const entry = node.items?.find((e) => e.id === item.id)
  const caption = entry?.caption?.[language] ?? entry?.caption?.en ?? {}
  return {
    date: caption.date ?? '',
    dynasty: caption.dynasty ?? (item.dynasty_ids?.[0] ? dynastyLabel(item.dynasty_ids[0]) : ''),
    location: caption.location ?? '',
    museum: caption.museum ?? (item.partner_id ? partnerLabel(item.partner_id) : ''),
  }
}
</script>

<template>
  <EssayView :key="exhibitionId" :spec="spec" :id="exhibitionId" class="content-box">
    <template #before-body="{ text }">
      <div v-if="text.extra?.intro_text" class="mwnf-sheet__block" v-html="renderBlock(String(text.extra.intro_text), { breaks: true })" />
    </template>

    <template #thumbnails="{ node, items, language }">
      <ul v-if="items.length" class="intro-items">
        <li v-for="item in items" :key="item.id">
          <router-link :to="{ name: 'item', params: { id: item.id } }" class="intro-item-card">
            <img v-if="item.images?.[0]?.url" :src="item.images[0].url" :alt="item.internal_name ?? ''" loading="lazy" />
            <p v-if="itemMeta(item, node, language).dynasty" class="intro-item-meta">{{ itemMeta(item, node, language).dynasty }}</p>
            <p v-if="itemMeta(item, node, language).date" class="intro-item-meta">{{ itemMeta(item, node, language).date }}</p>
            <p v-if="itemMeta(item, node, language).location" class="intro-item-meta">{{ itemMeta(item, node, language).location }}</p>
            <p v-if="itemMeta(item, node, language).museum" class="intro-item-meta">{{ itemMeta(item, node, language).museum }}</p>
          </router-link>
        </li>
      </ul>
    </template>

    <template #after>
      <a class="back-link" href="#" @click.prevent="back">← {{ $t('islamicart.exhibition.backTo') }} {{ exhibitionTitle }}</a>
    </template>
  </EssayView>
</template>

<style scoped>
.intro-items { list-style: none; display: flex; flex-direction: column; gap: 14px; padding: 0; }
.intro-item-card { display: block; border: 1px solid var(--border); background: var(--section-bg); padding: 12px; }
.intro-item-card img { width: 100%; aspect-ratio: 4 / 3; object-fit: cover; display: block; margin-bottom: 8px; }
.intro-item-meta { font-size: 12px; color: var(--muted); margin: 0 0 2px; }
</style>
