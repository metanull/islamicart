<script setup>
import { useRouter } from 'vue-router'
import { useI18n } from '@metanull/viewer-core'
import { PartnerMap, RecordLanguages, RelatedRecords, SheetSection } from '@metanull/viewer-layout/content'
import { RecordView } from '@metanull/viewer-layout/views'
import { permanentCollection } from '../composables/catalogue.js'
import { useInventoryData } from '../composables/useInventoryData.js'
import { partnerSheet } from '../composables/partner.js'

// The partner profile is the platform's composed record page, rendering the
// spec in composables/partner.js. What is this website's fills the page's
// slots: the header — the way back, the type badge, the view-objects action
// counted from the package's own `item_count` (never a scan of every item),
// the subtitle — and, after the sheet, the blocks a partner has that an item
// does not: contact details, logos, the map, and its held items.

defineProps({ id: { type: String, required: true } })

const router = useRouter()
const { countryLabel, items, mdInline } = useInventoryData()

function back() {
  if (window.history.length > 2) router.back()
  else router.push('/partners')
}

const { t } = useI18n()

function viewItemsLabel(record) {
  return record.type === 'institution' ? t('islamicart.action.viewMonuments') : t('islamicart.action.viewObjects')
}

function viewItemsLink(record) {
  return { name: 'permanent-collection-results', query: { partner: record.id } }
}

function partnerTypeLabel(record) {
  return record.type === 'institution' ? t('partner.info.typeInstitution') : t('partner.info.typeMuseum')
}

function normalizeUrl(url) {
  return url.startsWith('http') ? url : `http://${url}`
}

function contactPersons(record) {
  return [record.contact_person_1, record.contact_person_2].filter((cp) => cp && (cp.name || cp.title))
}

function hasContactInfo(record, text) {
  return Boolean(text.address || text.phone || text.email || text.website || record.additional_urls?.length)
}

// The held items, in the Permanent Collection's own row shape
// (composables/catalogue.js) — the reverse of `item.partner_id`, since a
// partner carries no forward list of the items it holds.
function heldItems(record) {
  return items.value.filter((i) => i.partner_id === record.id).map(permanentCollection.record)
}
</script>

<template>
  <RecordView :spec="partnerSheet" :id="id" class="detail content-box">
    <template #header="{ record, text, language, languages, select, dir }">
      <a class="back-link" href="#" @click.prevent="back">← {{ $t('partner.nav.back') }}</a>

      <div class="detail-type-badge">{{ partnerTypeLabel(record) }}</div>
      <RecordLanguages :languages="languages" :language="language" @select="select" />
      <h1 class="detail-title" :dir="dir" v-html="mdInline(text.name ?? record.internal_name ?? record.id)" />
      <h2 v-if="text.city || record.country_id" class="detail-subtitle">
        <template v-if="text.city">{{ text.city }}<template v-if="record.country_id">, </template></template>
        <template v-if="record.country_id">{{ countryLabel(record.country_id) }}</template>
      </h2>

      <div v-if="record.item_count" class="view-items-row">
        <RouterLink :to="viewItemsLink(record)" class="btn">
          {{ viewItemsLabel(record) }} ({{ record.item_count }}) →
        </RouterLink>
        <a v-if="text.website" :href="normalizeUrl(text.website)" target="_blank" rel="noopener" class="homepage-link">
          {{ $t('islamicart.action.visitWebsite') }} ↗
        </a>
      </div>
    </template>

    <template #after-sheet="{ record, text, dir }">
      <SheetSection v-if="hasContactInfo(record, text) || contactPersons(record).length" :heading="$t('partner.info.contact')" :dir="dir">
        <div v-if="hasContactInfo(record, text)" class="contact-block">
          <p v-if="text.address" class="contact-address">{{ text.address }}</p>
          <p v-if="text.phone">{{ $t('partner.info.phone') }}: {{ text.phone }}</p>
          <p v-if="text.email"><a :href="`mailto:${text.email}`">{{ text.email }}</a></p>
          <p v-if="text.website">
            <a :href="normalizeUrl(text.website)" target="_blank" rel="noopener">{{ text.website }}</a>
            <template v-for="(u, i) in record.additional_urls" :key="i">
              &nbsp;|&nbsp;<a :href="normalizeUrl(u.url)" target="_blank" rel="noopener">{{ u.title ?? u.url }}</a>
            </template>
          </p>
        </div>

        <div v-for="(cp, i) in contactPersons(record)" :key="i" class="contact-block contact-person">
          <p v-if="cp.title" class="contact-person-title">{{ cp.title }}</p>
          <p v-if="cp.name">{{ cp.name }}</p>
          <p v-if="cp.phone">{{ $t('partner.info.phone') }}: {{ cp.phone }}</p>
          <p v-if="cp.fax">{{ $t('partner.info.fax') }}: {{ cp.fax }}</p>
          <p v-if="cp.email"><a :href="`mailto:${cp.email}`">{{ cp.email }}</a></p>
        </div>
      </SheetSection>

      <SheetSection v-if="record.logos?.length" :heading="$t('partner.info.logo')" :dir="dir">
        <div class="logos">
          <img v-for="(logo, i) in record.logos" :key="i" :src="logo.url" :alt="logo.alt_text ?? ''" class="logo-img" />
        </div>
      </SheetSection>

      <!-- Legacy showed the map for a museum's own building, never an
           institution's (which may cover a whole country's monuments). -->
      <SheetSection v-if="record.type === 'museum'" :heading="$t('partner.map.map')" :dir="dir">
        <PartnerMap
          :latitude="record.latitude"
          :longitude="record.longitude"
          :zoom="record.map_zoom ?? 15"
          map-title-entry="partner.map.map"
          map-of-entry="partner.map.mapOf"
          open-map-link-entry="exhibition.action.openInOpenStreetMap"
          :label="text.name ?? record.internal_name ?? record.id"
        />
      </SheetSection>
    </template>

    <template #related="{ record }">
      <RelatedRecords
        v-if="heldItems(record).length"
        :heading="$t('record.related.items')"
        :records="heldItems(record)"
        variant="list"
      />
    </template>
  </RecordView>
</template>

<style scoped>
.detail-type-badge {
  display: inline-block;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--heading);
  border: 1px solid var(--accent-dark);
  padding: 2px 8px;
  margin: 10px 0;
  font-family: 'Roboto', sans-serif;
}

.detail-title {
  font-size: 24px;
  font-weight: 400;
  color: var(--heading);
  margin: 10px 0 4px;
  line-height: 1.3;
  font-family: 'Roboto', sans-serif;
}
.detail-subtitle {
  font-size: 14px;
  font-weight: 400;
  font-style: italic;
  color: var(--muted);
  margin-bottom: 16px;
  font-family: 'Roboto', sans-serif;
}

.view-items-row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}
.homepage-link {
  font-size: 13px;
  font-weight: 500;
  color: var(--nav-active);
  font-family: 'Roboto', sans-serif;
}

.contact-block {
  font-size: 13px;
  line-height: 1.7;
  color: var(--text);
  font-family: 'Roboto', sans-serif;
  margin-bottom: 12px;
}
.contact-person {
  padding-left: 12px;
  border-left: 3px solid var(--accent-dark);
}
.contact-person-title { font-weight: 500; color: var(--heading); }
.contact-address { white-space: pre-line; }

.logos { display: flex; gap: 16px; flex-wrap: wrap; align-items: center; }
.logo-img { max-height: 80px; max-width: 200px; object-fit: contain; }
</style>
