<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { I18nText } from '@metanull/viewer-core'
import { useInventoryData } from '../composables/useInventoryData.js'

const router = useRouter()
const {
  items, countries, partners, dynasties,
  countryLabel, dynastyLabel, partnerLabel,
} = useInventoryData()

const filterType = ref('country') // country | dynasty | partner | begin | end

// Build option lists from items actually present
const availableCountries = computed(() => {
  const ids = new Set(items.value.map(i => i.country_id).filter(Boolean))
  return countries.value
    .filter(c => ids.has(c.id))
    .map(c => ({ id: c.id, name: countryLabel(c.id) }))
    .sort((a, b) => a.name.localeCompare(b.name))
})

const availableDynasties = computed(() => {
  const ids = new Set(items.value.flatMap(i => i.dynasty_ids))
  return dynasties.value
    .filter(d => ids.has(d.id))
    .map(d => ({
      id: d.id,
      name: dynastyLabel(d.id),
      from_ad: d.from_ad,
    }))
    .sort((a, b) => (a.from_ad ?? 9999) - (b.from_ad ?? 9999))
})

const availablePartners = computed(() => {
  const ids = new Set(items.value.map(i => i.partner_id).filter(Boolean))
  return partners.value
    .filter(p => ids.has(p.id))
    .map(p => ({ id: p.id, name: partnerLabel(p.id) }))
    .sort((a, b) => a.name.localeCompare(b.name))
})

const selectedCountry = ref('')
const selectedDynasty = ref('')
const selectedPartner = ref('')
const beginDate = ref('')
const endDate = ref('')
const includeEpm = ref(false)

function search() {
  const q = {}
  if (filterType.value === 'country' && selectedCountry.value)   q.country = selectedCountry.value
  if (filterType.value === 'dynasty' && selectedDynasty.value)   q.dynasty = selectedDynasty.value
  if (filterType.value === 'partner' && selectedPartner.value)   q.partner = selectedPartner.value
  if (filterType.value === 'begin'   && beginDate.value)         q.begin   = beginDate.value
  if (filterType.value === 'end'     && endDate.value)           q.end     = endDate.value
  if (includeEpm.value) q.epm = '1'
  router.push({ path: '/permanent-collection/results', query: q })
}
</script>

<template>
  <div>
    <h1 class="section-heading">{{ $t('islamicart.nav.permanentCollection') }}</h1>

    <div class="content-box">
      <I18nText tag="p" class="intro-text" keypath="islamicart.pc.intro" />

      <table class="form-table filter-table">
        <tbody>
          <!-- Filter type selector. `value` is the filter this row drives and
               never a text; each label is written out so the check that every
               name resolves can read it. -->
          <tr v-for="opt in [
            { value: 'country', label: $t('islamicart.filter.country') },
            { value: 'dynasty', label: $t('islamicart.filter.periodDynasty') },
            { value: 'partner', label: $t('islamicart.filter.holdingInstitution') },
            { value: 'begin',   label: $t('islamicart.filter.startDate') },
            { value: 'end',     label: $t('islamicart.filter.endDate') },
          ]" :key="opt.value">
            <th>
              <label :for="'filter-' + opt.value">
                <input
                  type="radio"
                  :id="'filter-' + opt.value"
                  name="filterType"
                  :value="opt.value"
                  v-model="filterType"
                />
                {{ opt.label }}
              </label>
            </th>
            <td>
              <!-- Country -->
              <template v-if="opt.value === 'country'">
                <select v-model="selectedCountry" :disabled="filterType !== 'country'" style="width:280px">
                  <option value="">{{ $t('islamicart.filter.selectCountry') }}</option>
                  <option v-for="c in availableCountries" :key="c.id" :value="c.id">{{ c.name }}</option>
                </select>
              </template>

              <!-- Dynasty -->
              <template v-else-if="opt.value === 'dynasty'">
                <select v-model="selectedDynasty" :disabled="filterType !== 'dynasty'" style="width:280px">
                  <option value="">{{ $t('islamicart.filter.selectDynasty') }}</option>
                  <option v-for="d in availableDynasties" :key="d.id" :value="d.id">{{ d.name }}</option>
                </select>
              </template>

              <!-- Partner -->
              <template v-else-if="opt.value === 'partner'">
                <select v-model="selectedPartner" :disabled="filterType !== 'partner'" style="width:280px">
                  <option value="">{{ $t('islamicart.filter.selectInstitution') }}</option>
                  <option v-for="p in availablePartners" :key="p.id" :value="p.id">{{ p.name }}</option>
                </select>
              </template>

              <!-- Begin date -->
              <template v-else-if="opt.value === 'begin'">
                <input
                  type="number"
                  v-model="beginDate"
                  :disabled="filterType !== 'begin'"
                  :placeholder="$t('islamicart.filter.fromYearHint')"
                  style="width:120px"
                />
              </template>

              <!-- End date -->
              <template v-else-if="opt.value === 'end'">
                <input
                  type="number"
                  v-model="endDate"
                  :disabled="filterType !== 'end'"
                  :placeholder="$t('islamicart.filter.endDateHint')"
                  style="width:120px"
                />
              </template>
            </td>
          </tr>

          <!-- Collection scope -->
          <tr>
            <th></th>
            <td>
              <label class="epm-toggle">
                <input type="checkbox" v-model="includeEpm" />
                {{ $t('islamicart.filter.includeEpm') }}
              </label>
            </td>
          </tr>

          <!-- Submit -->
          <tr>
            <th></th>
            <td style="padding-top:12px">
              <button class="btn" @click="search">{{ $t('islamicart.action.browse') }}</button>
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
  padding: 6px 16px 6px 0;
  font-family: 'Roboto', sans-serif;
  font-size: 13px;
  color: var(--text);
  vertical-align: middle;
  width: auto;
}
.filter-table th label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-weight: normal;
}
.filter-table input[type="radio"] { cursor: pointer; }

select:disabled, input:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.epm-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-family: 'Roboto', sans-serif;
  color: var(--text);
  cursor: pointer;
}
</style>
