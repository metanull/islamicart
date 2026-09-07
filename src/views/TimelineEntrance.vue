<script setup>
import { I18nText } from '@metanull/viewer-core'
import { TimelineResultsView } from '@metanull/viewer-layout/views'
import { timelineEntrance } from '../composables/timeline.js'

// The timeline entrance is the platform's composed timeline view, rendering
// the entrance spec in composables/timeline.js. What is this website's is
// the heading and the intro paragraph legacy printed above the form.
</script>

<template>
  <div>
    <h1 class="section-heading">{{ $t('islamicart.nav.timeline') }}</h1>

    <div class="content-box">
      <I18nText tag="p" class="intro-text" keypath="islamicart.timeline.intro" />
      <TimelineResultsView :spec="timelineEntrance" />
    </div>
  </div>
</template>

<style scoped>
.intro-text {
  font-size: 13px;
  line-height: 1.65;
  color: var(--muted);
  margin-bottom: 16px;
  font-family: 'Roboto', sans-serif;
}
</style>
