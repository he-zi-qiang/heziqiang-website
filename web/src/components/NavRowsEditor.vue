<script setup lang="ts">
import type { NavRow } from '@/api/types'

/**
 * 编辑一组「中文名 / 英文名 / 去哪」的导航行。
 * 首页两侧的索引、404 页的出口都用它。
 */
const props = defineProps<{ rows: NavRow[]; hint?: string }>()

function add() {
  props.rows.push({ zh: '', en: '', to: '/' })
}
function remove(i: number) {
  props.rows.splice(i, 1)
}
function move(i: number, delta: -1 | 1) {
  const target = i + delta
  if (target < 0 || target >= props.rows.length) return
  const [row] = props.rows.splice(i, 1)
  if (row) props.rows.splice(target, 0, row)
}
</script>

<template>
  <div v-for="(row, i) in rows" :key="i" class="nav-row">
    <div class="field">
      <label>中文</label>
      <input v-model="row.zh" type="text" />
    </div>
    <div class="field">
      <label>英文</label>
      <input v-model="row.en" type="text" />
    </div>
    <div class="field">
      <label>去哪</label>
      <input v-model="row.to" type="text" placeholder="/writing" />
    </div>
    <div class="nav-ops">
      <button class="btn small" type="button" @click="move(i, -1)">↑</button>
      <button class="btn small" type="button" @click="move(i, 1)">↓</button>
      <button class="btn small danger" type="button" @click="remove(i)">删</button>
    </div>
  </div>
  <p v-if="hint" class="hint" style="margin: 4px 0 14px">{{ hint }}</p>
  <button class="btn small" type="button" @click="add">＋ 加一行</button>
</template>

<style scoped>
.nav-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1.4fr auto;
  gap: 0 14px;
  align-items: end;
}
.nav-ops { display: flex; gap: 6px; margin-bottom: 20px; }
@media (max-width: 760px) {
  .nav-row { grid-template-columns: 1fr; }
  .nav-ops { margin-bottom: 24px; }
}
</style>
