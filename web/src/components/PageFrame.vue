<template>
  <div class="zx-page flex flex-col">
    <a class="sr-only" href="#main-content">跳到主内容</a>
    <header
      class="h-48px shrink-0 flex items-center px-20px bg-canvas border-b border-edge"
    >
      <p class="m-0 text-16px font-500 leading-24px text-black">智能会议室</p>
    </header>
    <main id="main-content" class="flex-1 p-20px" tabindex="-1">
      <div class="max-w-1200px mx-auto">
        <slot />
      </div>
    </main>
  </div>
</template>
