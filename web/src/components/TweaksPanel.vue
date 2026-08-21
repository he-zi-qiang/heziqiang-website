<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'

/**
 * 纸面 / 强调色微调面板 —— 作者本地调色用。
 * 旧版是首页里挂 React + Babel 三个 CDN 脚本实现的；现在改成一个只在
 * 开发环境挂载的 Vue 组件，访客端一行相关代码都不会加载。
 */
const STYLE_KEY = 'hz-style-v2'
const ACCENTS = ['#9C4226', '#33506B', '#43603F']
const PAPERS = ['#FBF9F3', '#F4EDDC', '#FFFFFF']

const open = ref(false)
const accent = ref(ACCENTS[0]!)
const paper = ref(PAPERS[0]!)

onMounted(() => {
  try {
    const saved = JSON.parse(localStorage.getItem(STYLE_KEY) || '{}')
    if (saved.accent) accent.value = saved.accent
    if (saved.paper) paper.value = saved.paper
  } catch { /* 忽略 */ }
})

watch([accent, paper], ([a, p]) => {
  document.documentElement.style.setProperty('--accent', a)
  document.documentElement.style.setProperty('--paper', p)
  try {
    localStorage.setItem(STYLE_KEY, JSON.stringify({ accent: a, paper: p }))
  } catch { /* 忽略 */ }
})

function reset() {
  accent.value = ACCENTS[0]!
  paper.value = PAPERS[0]!
}
</script>

<template>
  <div class="tweaks">
    <button class="tweaks-toggle" type="button" @click="open = !open">
      {{ open ? '收起' : '微调' }}
    </button>
    <div v-if="open" class="tweaks-body">
      <div class="tweaks-label">纸面 · dev only</div>
      <div class="tweaks-row">
        <span>强调色</span>
        <button v-for="c in ACCENTS" :key="c" class="swatch" :class="{ on: accent === c }"
                :style="{ background: c }" :title="c" type="button" @click="accent = c" />
      </div>
      <div class="tweaks-row">
        <span>纸张</span>
        <button v-for="c in PAPERS" :key="c" class="swatch" :class="{ on: paper === c }"
                :style="{ background: c }" :title="c" type="button" @click="paper = c" />
      </div>
      <button class="tweaks-reset" type="button" @click="reset">恢复默认</button>
    </div>
  </div>
</template>

<style scoped>
.tweaks { position: fixed; right: 20px; bottom: 20px; z-index: 60; font-family: var(--serif); }
.tweaks-toggle, .tweaks-reset {
  appearance: none; cursor: pointer; font-family: inherit;
  background: var(--paper); border: 1px solid var(--line); color: var(--muted);
  border-radius: 999px; padding: 6px 14px; font-size: 12px; letter-spacing: 0.08em;
}
.tweaks-toggle:hover, .tweaks-reset:hover { color: var(--accent); border-color: var(--accent); }
.tweaks-body {
  margin-top: 10px; padding: 14px; width: 200px;
  background: var(--paper); border: 1px solid var(--line); border-radius: 10px;
  display: flex; flex-direction: column; gap: 12px;
  box-shadow: 0 8px 30px rgb(0 0 0 / 0.08);
}
.tweaks-label { font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase; color: var(--faint); }
.tweaks-row { display: flex; align-items: center; gap: 8px; font-size: 12.5px; color: var(--muted); }
.tweaks-row > span:first-child { width: 44px; }
.swatch {
  width: 20px; height: 20px; border-radius: 50%; cursor: pointer;
  border: 1px solid var(--line); padding: 0;
}
.swatch.on { outline: 1px solid var(--accent); outline-offset: 2px; }
.tweaks-reset { align-self: flex-start; }
</style>
