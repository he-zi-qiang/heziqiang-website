<script setup lang="ts">
/**
 * 宽屏下的「左正文 + 右侧栏」。左栏是阅读宽度的正文，右栏放和这一页相关的内容
 * （首页的索引、列表页的简介与年份、简历的照片与联系方式、文章的目录）。
 *
 * 窄屏（< 1080px）右栏整个不显示：放进右栏的东西，各页面在正文里另有一份 .only-narrow 的原位版本。
 * 右栏内容随滚动停在视口上方，长页面往下翻时还看得到。
 */
</script>

<template>
  <div class="two-col">
    <div class="main-col">
      <slot />
    </div>
    <aside v-if="$slots.aside" class="side-col no-print">
      <div class="side-inner">
        <slot name="aside" />
      </div>
    </aside>
  </div>
</template>
