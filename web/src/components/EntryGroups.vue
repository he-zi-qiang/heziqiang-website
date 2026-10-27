<script setup lang="ts">
import type { EntryGroup, EntryKind } from '@/api/types'
import EntryRow from './EntryRow.vue'

defineProps<{ groups: EntryGroup[]; kind: EntryKind }>()
</script>

<template>
  <template v-for="(group, i) in groups" :key="group.label ?? `g${i}`">
    <!-- id 让年份可以用 #y-2026 这样的锚点直接跳到 -->
    <div v-if="group.label" :id="`y-${group.label}`" class="smallcaps year-mark">{{ group.label }}</div>
    <div class="entry-list" :data-kind="kind">
      <EntryRow
        v-for="entry in group.items"
        :key="entry.slug"
        :entry="entry"
        :show-title="kind !== 'learning'"
      />
    </div>
  </template>
</template>
