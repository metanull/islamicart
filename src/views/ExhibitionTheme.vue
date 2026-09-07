<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { EssayView } from '@metanull/viewer-layout/views'
import { exhibitionTree } from '../composables/exhibitions.js'
import { exhibitionThemeSpec, themeRoute } from '../composables/exhibitionSpecs.js'
import { useInventoryData } from '../composables/useInventoryData.js'

// A theme's page: an `EssayView` over the page node — the theme itself
// carries no quote, prose or items of its own (`useInventoryData.js`'s old
// walk always read `activePage`, never the theme). `?tab` in the query picks
// which of the theme's pages is active, same key legacy used; absent, this
// lands on the theme's first page. `spec.breadcrumb: true` renders the way
// back (exhibition, then theme) itself; no header override is needed here.
const route = useRoute()
const { dynastyLabel, mdInline } = useInventoryData()

const exhibitionId = computed(() => decodeURIComponent(route.params.exhibitionId))
const themeId = computed(() => decodeURIComponent(route.params.themeId))
// A new exhibition id is a new tree (`EssayView` reads `spec.tree` once, at
// setup); `:key` below forces the remount that keeps it in step. Moving
// between themes/pages of the *same* exhibition never remounts — the tree
// itself is reactive to that, only the exhibition it is rooted on is not.
const tree = exhibitionTree(exhibitionId.value)
const spec = exhibitionThemeSpec(tree)
const route_ = themeRoute(tree)

const pages = computed(() => tree.children(themeId.value))
const activeId = computed(() => {
  const list = pages.value
  const idx = Number.parseInt(route.query.tab ?? '0', 10)
  const page = Number.isFinite(idx) && idx >= 0 && idx < list.length ? list[idx] : list[0]
  return page?.id ?? themeId.value
})

const hasIntroduction = computed(() => {
  const e = tree.root.value
  return Boolean(e) && (e.items?.length ?? 0) > 0
})

// `navigation: 'tree'` (decision D2) crosses from a theme's last page into
// the *next theme's own node*, which — like the theme itself — carries no
// content to show; skip past it to the next genuine page. What is left
// after skipping past the very first page's own predecessor is the true
// head of the exhibition, where the `navigation` slot below links back to
// the introduction instead, same as legacy has no "previous" there either.
function previousPage(id) {
  let node = tree.previous(id)
  while (node && tree.parents(node.id).length !== 2) node = tree.previous(node.id)
  return node
}
function nextPage(id) {
  let node = tree.next(id)
  while (node && tree.parents(node.id).length !== 2) node = tree.next(node.id)
  return node
}

function entryCaption(item, node, language) {
  const entry = node?.items?.find((e) => e.id === item.id)
  return entry?.caption?.[language] ?? entry?.caption?.en ?? {}
}
// The dynasty line: read the same way the old detail panel did, placed in
// `after-body` rather than the panel — the panel's own fields sit beside
// the picture, this beside the narrative.
function dynastyLine(item, node, language) {
  const caption = entryCaption(item, node, language)
  return caption.dynasty ?? (item.dynasty_ids?.[0] ? dynastyLabel(item.dynasty_ids[0]) : '')
}
function justificationText(item, node, language) {
  return entryCaption(item, node, language).justification ?? ''
}
</script>

<template>
  <EssayView :key="exhibitionId" :spec="spec" :id="activeId" class="content-box">
    <template #after-body="{ selected, node, language }">
      <p v-if="selected && dynastyLine(selected, node, language)" class="theme-dynasty-line">{{ dynastyLine(selected, node, language) }}</p>
    </template>

    <template #justifications="{ selected, node, language }">
      <p v-if="selected && justificationText(selected, node, language)" class="theme-justification" v-html="mdInline(justificationText(selected, node, language))" />
    </template>

    <template #navigation="{ node }">
      <div class="mwnf-essay__nav">
        <router-link v-if="previousPage(node.id)" :to="route_(previousPage(node.id))" class="mwnf-essay__nav-link mwnf-essay__nav-link--previous">
          ← {{ $t('exhibition.theme.previous') }}
        </router-link>
        <router-link
          v-else-if="hasIntroduction"
          :to="{ name: 'exhibition-introduction', params: { exhibitionId } }"
          class="mwnf-essay__nav-link mwnf-essay__nav-link--previous"
        >
          ← {{ $t('exhibition.nav.introduction') }}
        </router-link>
        <span v-else class="mwnf-essay__nav-spacer"></span>

        <router-link v-if="nextPage(node.id)" :to="route_(nextPage(node.id))" class="mwnf-essay__nav-link mwnf-essay__nav-link--next">
          {{ $t('exhibition.theme.next') }} →
        </router-link>
      </div>
    </template>
  </EssayView>
</template>

<style scoped>
.theme-dynasty-line { font-size: 12px; color: var(--muted); margin-top: 10px; }
.theme-justification {
  font-size: 13px;
  line-height: 1.6;
  color: var(--text);
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid var(--border);
}
</style>
