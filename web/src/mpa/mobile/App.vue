<template>
  <div
    class="zx-page"
    :style="{
      paddingTop: 'env(safe-area-inset-top, 0px)',
      paddingBottom: 'env(safe-area-inset-bottom, 0px)'
    }"
  >
    <router-view />
  </div>
</template>
