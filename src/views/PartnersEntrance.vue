<script setup>
import { useRouter } from 'vue-router'
import { I18nText } from '@metanull/viewer-core'

const router = useRouter()

function browse(type, project) {
  router.push({ path: '/partners/results', query: { type, project } })
}
</script>

<template>
  <div>
    <h1 class="section-heading">{{ $t('islamicart.nav.partners') }}</h1>

    <div class="content-box">
      <I18nText tag="p" class="intro-text" keypath="islamicart.partner.introDiscover" />

      <table class="form-table filter-table">
        <tbody>
          <tr>
            <th><label>{{ $t('islamicart.partner.museums') }}</label></th>
            <td>
              <button class="btn" @click="browse('museum', 'ISL')">{{ $t('islamicart.action.browseMuseums') }} →</button>
            </td>
          </tr>
          <tr>
            <th><label>{{ $t('islamicart.partner.others') }}</label></th>
            <td>
              <button class="btn" @click="browse('institution', 'ISL')">{{ $t('islamicart.action.browseInstitutions') }} →</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="content-box">
      <I18nText tag="p" class="intro-text" keypath="islamicart.partner.introExplore" />

      <table class="form-table filter-table">
        <tbody>
          <tr>
            <th><label>{{ $t('islamicart.partner.museums') }}</label></th>
            <td>
              <button class="btn" @click="browse('museum', 'EPM')">{{ $t('islamicart.action.browseMuseums') }} →</button>
            </td>
          </tr>
          <tr>
            <th><label>{{ $t('islamicart.partner.others') }}</label></th>
            <td>
              <button class="btn" @click="browse('institution', 'EPM')">{{ $t('islamicart.action.browseInstitutions') }} →</button>
            </td>
          </tr>
        </tbody>
      </table>
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

.filter-table th {
  text-align: left;
  font-weight: normal;
  padding: 10px 16px 10px 0;
  font-family: 'Roboto', sans-serif;
  font-size: 13px;
  color: var(--text);
  vertical-align: middle;
  width: auto;
}
</style>
